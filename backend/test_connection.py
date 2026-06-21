"""Quick integration test for Music City Odia API (mock/dev mode)."""
import json
import urllib.error
import urllib.request

import jwt

from app.config import settings

BASE = "http://localhost:8000"
SECRET = settings.supabase_jwt_secret


def req(method: str, path: str, token: str | None = None, body: dict | None = None) -> tuple[int, object]:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body else None
    request = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = raw.decode()
        return e.code, payload


def main() -> None:
    results: list[str] = []

    for path in ["/", "/songs", "/genres", "/songs/mock-song-1"]:
        status, data = req("GET", path)
        ok = status == 200
        extra = ""
        if path == "/songs" and isinstance(data, list):
            extra = f" ({len(data)} songs)"
        if path == "/songs/mock-song-1" and isinstance(data, dict):
            extra = f" ({data.get('title')})"
        results.append(f"{'PASS' if ok else 'FAIL'} GET {path} -> {status}{extra}")

    cust = jwt.encode(
        {"sub": "cust-001", "email": "customer@test.com", "role": "authenticated"},
        SECRET,
        algorithm="HS256",
    )
    admin = jwt.encode(
        {"sub": "admin-001", "email": "admin@test.com", "role": "authenticated"},
        SECRET,
        algorithm="HS256",
    )

    status, _ = req("GET", "/me/purchases")
    results.append(f"{'PASS' if status == 401 else 'FAIL'} GET /me/purchases (no auth) -> {status}")

    status, purchases = req("GET", "/me/purchases", cust)
    count = len(purchases) if isinstance(purchases, list) else 0
    results.append(f"{'PASS' if status == 200 else 'FAIL'} GET /me/purchases (customer) -> {status}, count={count}")

    status, order = req("POST", "/orders", cust, {"song_ids": ["mock-song-1"]})
    results.append(
        f"{'PASS' if status == 200 else 'FAIL'} POST /orders -> {status}, mock={order.get('is_mock') if isinstance(order, dict) else order}"
    )

    if status == 200 and isinstance(order, dict):
        verify_status, verify = req(
            "POST",
            "/orders/verify",
            cust,
            {
                "razorpay_order_id": order["razorpay_order_id"],
                "razorpay_payment_id": "pay_mock_test",
                "razorpay_signature": "mock_signature_success",
            },
        )
        results.append(
            f"{'PASS' if verify_status == 200 else 'FAIL'} POST /orders/verify -> {verify_status}, {verify.get('status') if isinstance(verify, dict) else verify}"
        )

        stream_status, stream = req("GET", "/songs/mock-song-1/stream", cust)
        results.append(
            f"{'PASS' if stream_status == 403 else 'FAIL'} GET /stream (not purchased yet) -> {stream_status}"
        )

    status, stats = req("GET", "/admin/stats", admin)
    results.append(
        f"{'PASS' if status == 200 else 'FAIL'} GET /admin/stats -> {status}, revenue={stats.get('total_revenue') if isinstance(stats, dict) else stats}"
    )

    status, admin_songs = req("GET", "/admin/songs", admin)
    n = len(admin_songs) if isinstance(admin_songs, list) else 0
    results.append(f"{'PASS' if status == 200 else 'FAIL'} GET /admin/songs -> {status}, count={n}")

    print("\n".join(results))
    failed = sum(1 for r in results if r.startswith("FAIL"))
    print(f"\n{len(results) - failed}/{len(results)} passed")
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
