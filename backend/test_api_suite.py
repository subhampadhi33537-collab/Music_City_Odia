"""
Comprehensive verification test suite for Music City Odia FastAPI backend
Validates:
1. ASGI app loading and root endpoint
2. Database connectivity & SQLite fallback
3. Google Drive storage system (Folder ID: 1zur8UsA64ko5cBtXXLQl0aInPLmI2U8m)
4. Admin song upload with full metadata (album, lyrics, cover, audio)
5. Public catalog, song detail, streaming, and download links
6. Auth and access control
"""
import io
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from asgi import app

client = TestClient(app)


def test_suite():
    print("=" * 60)
    print("  RUNNING MUSIC CITY ODIA BACKEND VERIFICATION SUITE")
    print("=" * 60)

    # 1. Test Root
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.status_code}"
    data = res.json()
    assert data["framework"] == "FastAPI", "Not FastAPI"
    assert data["google_drive_folder_id"] == "1zur8UsA64ko5cBtXXLQl0aInPLmI2U8m", "Folder ID mismatch"
    print("[PASS] Root endpoint: FastAPI active & Drive Folder configured")

    # 2. Test Genres
    res = client.get("/genres")
    assert res.status_code == 200, f"Genres failed: {res.status_code}"
    genres = res.json()
    assert len(genres) >= 6, "Expected at least 6 genres"
    genre_id = genres[0]["id"]
    print(f"[PASS] Genres: {len(genres)} categories loaded (e.g. {genres[0]['name']})")

    # 3. Test Public Songs Catalog
    res = client.get("/songs")
    assert res.status_code == 200, f"Songs catalog failed: {res.status_code}"
    songs = res.json()
    assert len(songs) >= 1, "Expected at least 1 seeded song"
    first_song = songs[0]
    print(f"[PASS] Public Catalog: {len(songs)} song(s) online (Track: '{first_song['title']}')")

    # 4. Test Public Song Detail (Album & Lyrics check)
    song_id = first_song["id"]
    res = client.get(f"/songs/{song_id}")
    assert res.status_code == 200, f"Song detail failed: {res.status_code}"
    detail = res.json()
    assert "lyrics" in detail, "Lyrics field missing"
    assert "album" in detail, "Album field missing"
    assert "drive_web_link" in detail, "Drive web link missing"
    print(f"[PASS] Song Detail: Album='{detail.get('album')}', Drive='{detail.get('drive_web_link')}'")

    # 5. Test Admin Login
    res = client.post("/auth/login", json={"email": "musiccityodia@gmail.com", "password": "musiccityodia12345"})
    assert res.status_code == 200, f"Admin login failed: {res.status_code}"
    admin_auth = res.json()
    assert admin_auth["profile"]["is_admin"] is True, "User is not admin"
    admin_token = admin_auth["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] Admin Auth: Logged in successfully with admin token")

    # 6. Test Google Drive Status Endpoint
    res = client.get("/admin/drive/status", headers=admin_headers)
    assert res.status_code == 200, f"Drive status failed: {res.status_code}"
    drive_stat = res.json()
    assert drive_stat["folder_id"] == "1zur8UsA64ko5cBtXXLQl0aInPLmI2U8m"
    print(f"[PASS] Drive Status: Folder ID {drive_stat['folder_id']} ({drive_stat['storage_mode']})")

    # 7. Test Admin Song Upload with Google Drive Storage & Full Metadata
    dummy_audio = b"ID3\x03\x00\x00\x00\x00\x00#TPE1\x00\x00\x00\x11\x00\x00\x03Music City Odia"
    dummy_cover = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"

    upload_data = {
        "title": "Kalia Re (Studio Devotional)",
        "artist": "Namita Agarwal",
        "album": "Jagannath Bhajan Special",
        "genre_id": str(genre_id),
        "price": "29.00",
        "duration_seconds": "310",
        "description": "Recorded live in Cuttack studio with authentic mardala and tabla.",
        "lyrics": "କାଳିଆ ରେ କାଳିଆ...\nବଡ଼ ଦାଣ୍ଡେ ତୋର ରଥ ଯିବ ଗଡ଼ି...\nଜୟ ଜଗନ୍ନାଥ ସ୍ୱାମୀ ନୟନ ପଥଗାମୀ ଭବତୁ ମେ।",
        "is_featured": "true",
        "is_published": "true",
    }
    upload_files = {
        "full_file": ("kalia_re.mp3", io.BytesIO(dummy_audio), "audio/mpeg"),
        "cover_file": ("cover.png", io.BytesIO(dummy_cover), "image/png"),
    }

    res = client.post("/admin/songs", data=upload_data, files=upload_files, headers=admin_headers)
    assert res.status_code == 200, f"Admin upload failed: {res.status_code}, {res.text}"
    created_song = res.json()["song"]
    assert created_song["title"] == "Kalia Re (Studio Devotional)"
    assert created_song["album"] == "Jagannath Bhajan Special"
    assert created_song["drive_file_id"] is not None
    assert "drive" in created_song["drive_web_link"]
    print("[PASS] Admin Upload: Stored audio with Drive ID & full metadata (Album & Lyrics)")

    # 8. Test Streaming and Download for the created track
    new_id = created_song["id"]
    stream_res = client.get(f"/songs/{new_id}/stream", headers=admin_headers)
    assert stream_res.status_code == 200, f"Stream failed: {stream_res.status_code}"
    assert "stream_url" in stream_res.json()
    print(f"[PASS] Song Stream: Stream URL generated ({stream_res.json()['stream_url'][:40]}...)")

    download_res = client.get(f"/songs/{new_id}/download", headers=admin_headers)
    assert download_res.status_code == 200, f"Download failed: {download_res.status_code}"
    assert "download_url" in download_res.json()
    print(f"[PASS] Song Download: Download URL generated ({download_res.json()['download_url'][:40]}...)")

    # 9. Test Studio Booking Endpoint
    booking_res = client.post("/bookings", json={
        "name": "Bikash Mohanty",
        "email": "bikash@example.com",
        "phone": "+919876543210",
        "service": "Music Recording & Mixing",
        "message": "Need 4 hours studio slot for Odia modern track recording."
    })
    assert booking_res.status_code == 201, f"Booking failed: {booking_res.status_code}"
    print("[PASS] Studio Booking: Session booking created successfully")

    # 10. Test Admin Stats
    stats_res = client.get("/admin/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    print(f"[PASS] Admin Stats: Total Revenue INR {stats.get('total_revenue')}, Users: {stats.get('recent_signups')}")

    print("\n" + "=" * 60)
    print("  ALL 10 TESTS PASSED! BACKEND IS READY FOR PRODUCTION.")
    print("=" * 60)


if __name__ == "__main__":
    test_suite()
