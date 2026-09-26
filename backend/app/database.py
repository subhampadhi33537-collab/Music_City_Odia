"""
Music City Odia — PostgreSQL Database Engine
PostgreSQL is the single, primary database engine (Supabase PostgreSQL via psycopg2 pool).
No fallback database is used.
"""
import logging
import threading
from contextlib import contextmanager
from typing import Any, Dict, List, Optional

import bcrypt
import psycopg2
from psycopg2 import pool as pg_pool
from psycopg2.extras import RealDictCursor

from app.config import settings

logger = logging.getLogger(__name__)

# Connection pool state
_pg_pool: Optional[pg_pool.ThreadedConnectionPool] = None
_pool_lock = threading.Lock()


# ══════════════════════════════════════════════════════════════════════════════
# 1. CONNECTION LAYER (PostgreSQL Only)
# ══════════════════════════════════════════════════════════════════════════════

def _create_pool(dsn: str) -> pg_pool.ThreadedConnectionPool:
    """Create a new ThreadedConnectionPool for PostgreSQL."""
    # Ensure connect_timeout is configured
    clean_dsn = dsn.strip()
    if "?" not in clean_dsn:
        connect_dsn = clean_dsn + "?connect_timeout=10"
    else:
        if "connect_timeout" not in clean_dsn:
            connect_dsn = clean_dsn + "&connect_timeout=10"
        else:
            connect_dsn = clean_dsn

    return pg_pool.ThreadedConnectionPool(
        minconn=1,
        maxconn=10,
        dsn=connect_dsn,
        cursor_factory=RealDictCursor,
    )


def init_engine() -> bool:
    """Initialize the PostgreSQL connection pool."""
    global _pg_pool
    with _pool_lock:
        try:
            if _pg_pool is not None and not _pg_pool.closed:
                return True

            dsn = settings.database_url
            _pg_pool = _create_pool(dsn)

            # Quick smoke test
            conn = _pg_pool.getconn()
            with conn.cursor() as cur:
                cur.execute("SELECT 1 as test")
                res = cur.fetchone()
            _pg_pool.putconn(conn)

            logger.info("✅  PostgreSQL connected successfully.")
            return True
        except Exception as exc:
            _pg_pool = None
            logger.error(
                f"❌  PostgreSQL connection failed: {exc}\n"
                f"     DATABASE_URL host: {settings.database_url.split('@')[-1] if '@' in settings.database_url else 'hidden'}\n"
                f"     NOTE: If using Supabase, ensure your project is ACTIVE / UNPAUSED at:\n"
                f"           https://supabase.com/dashboard\n"
                f"     PostgreSQL is the only database configured. No fallback will be used."
            )
            return False


@contextmanager
def get_db_conn():
    """
    Yield a thread-safe psycopg2 connection from the pool.
    Commits on normal exit, rolls back on exception, returns connection to pool.
    """
    global _pg_pool
    conn = None
    with _pool_lock:
        if _pg_pool is None or _pg_pool.closed:
            # Attempt to establish / reconnect pool
            try:
                _pg_pool = _create_pool(settings.database_url)
            except Exception as e:
                raise RuntimeError(
                    f"PostgreSQL database is currently unreachable: {e}. "
                    f"Please ensure your Supabase project is unpaused and active at https://supabase.com/dashboard."
                )

        try:
            conn = _pg_pool.getconn()
        except Exception as e:
            raise RuntimeError(
                f"Failed to acquire PostgreSQL connection from pool: {e}. "
                f"Please verify PostgreSQL server status."
            )

    try:
        # Check connection liveness
        if conn.closed:
            conn = psycopg2.connect(settings.database_url, cursor_factory=RealDictCursor)
        yield conn
        conn.commit()
    except Exception:
        if conn and not conn.closed:
            conn.rollback()
        raise
    finally:
        if conn and _pg_pool and not _pg_pool.closed:
            with _pool_lock:
                try:
                    _pg_pool.putconn(conn)
                except Exception:
                    pass


def execute_query(
    query: str,
    params: Optional[List[Any]] = None,
    fetch: bool = False,
    fetch_one: bool = False,
) -> Any:
    """Execute a parameterized SQL query on PostgreSQL."""
    params = params or []
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            if fetch_one:
                row = cur.fetchone()
                return dict(row) if row else None
            if fetch:
                rows = cur.fetchall()
                return [dict(r) for r in rows] if rows else []
            return None


def execute_query_one(
    query: str,
    params: Optional[List[Any]] = None,
) -> Optional[Dict[str, Any]]:
    """Execute query and fetch a single record."""
    return execute_query(query, params, fetch_one=True)


# ══════════════════════════════════════════════════════════════════════════════
# 2. SCHEMA DEFINITION & CREATION (PostgreSQL Native DDL)
# ══════════════════════════════════════════════════════════════════════════════

_PG_TABLES = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS genres (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS songs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        album TEXT,
        genre_id INTEGER REFERENCES genres(id) ON DELETE SET NULL,
        description TEXT,
        lyrics TEXT,
        cover_image_url TEXT,
        drive_file_id TEXT,
        drive_web_link TEXT,
        drive_download_link TEXT,
        preview_storage_path TEXT,
        full_storage_path TEXT,
        price NUMERIC(10, 2) DEFAULT 0.00,
        duration_seconds INTEGER,
        is_featured BOOLEAN DEFAULT FALSE,
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        razorpay_order_id TEXT UNIQUE,
        razorpay_payment_id TEXT,
        status TEXT DEFAULT 'created',
        total_amount NUMERIC(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        song_id INTEGER REFERENCES songs(id) ON DELETE SET NULL,
        price NUMERIC(10, 2) NOT NULL
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, song_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT NOT NULL,
        service TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'new',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """,
]


def _create_tables():
    """Create all required PostgreSQL tables if they don't exist."""
    for ddl in _PG_TABLES:
        try:
            execute_query(ddl)
        except Exception as e:
            logger.warning(f"DDL notice / warning: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# 3. SEED DATA (Admin, Genres, Demo Song)
# ══════════════════════════════════════════════════════════════════════════════

def _seed_data():
    """Seed default genres, admin account, and initial song if database is fresh."""
    # 1. Genres
    default_genres = [
        "Odia Pop", "Sambalpuri Folk", "Bhajan & Devotional",
        "Romantic Hits", "Modern Studio Odia", "Classical Odia",
    ]
    for g in default_genres:
        try:
            execute_query(
                "INSERT INTO genres (name) VALUES (%s) ON CONFLICT (name) DO NOTHING",
                [g]
            )
        except Exception as e:
            logger.debug(f"Genre seed notice: {e}")

    # 2. Admin User
    admin_email = "musiccityodia@gmail.com"
    admin_password = "musiccityodia12345"
    try:
        hashed = bcrypt.hashpw(admin_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        existing = execute_query_one("SELECT id FROM users WHERE email = %s", [admin_email])
        if existing:
            execute_query(
                "UPDATE users SET password_hash = %s, is_admin = TRUE WHERE email = %s",
                [hashed, admin_email]
            )
            logger.info(f"✅  Admin user verified and updated: {admin_email}")
        else:
            execute_query(
                """
                INSERT INTO users (full_name, email, phone, password_hash, is_admin)
                VALUES (%s, %s, %s, %s, TRUE)
                """,
                ["Music City Admin", admin_email, "+919937987978", hashed]
            )
            logger.info(f"✅  Admin user created: {admin_email}")
    except Exception as e:
        logger.warning(f"Admin seed notice: {e}")

    # 3. Sample Song (only if catalog is empty)
    try:
        row = execute_query_one("SELECT COUNT(*) as count FROM songs")
        if row and int(row["count"]) == 0:
            genre_row = execute_query_one("SELECT id FROM genres LIMIT 1")
            gid = genre_row["id"] if genre_row else None
            create_song({
                "title": "Mu Odia Toka (Super Bass Mix)",
                "artist": "Music City Singer",
                "album": "Super Bass Odia Vol. 1",
                "genre_id": gid,
                "description": "Chartbuster single produced inside Music City Odia Studio.",
                "lyrics": "ମୁଁ ଓଡ଼ିଆ ଟୋକା, ଛାତି ମୋର ଚଉଡ଼ା...\nମାଟି ମୋର ଜନ୍ମଭୂମି, ଜଗନ୍ନାଥ ସାହା...",
                "cover_image_url": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600",
                "drive_file_id": settings.google_drive_folder_id,
                "drive_web_link": f"https://drive.google.com/drive/folders/{settings.google_drive_folder_id}",
                "drive_download_link": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                "preview_storage_path": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                "full_storage_path": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                "price": 19.00,
                "duration_seconds": 240,
                "is_featured": True,
                "is_published": True,
            })
            logger.info("✅  Seeded demo track in PostgreSQL catalog.")
    except Exception as e:
        logger.warning(f"Song seed notice: {e}")


def init_db():
    """Initialize PostgreSQL connection, tables, and seeds."""
    connected = init_engine()
    if connected:
        _create_tables()
        _seed_data()
        logger.info("🗄️   PostgreSQL database ready (primary & only database).")
    else:
        logger.warning(
            "⚠️  PostgreSQL could not connect at startup. "
            "Server will attempt to reconnect on incoming requests. "
            "Please ensure Supabase project is active."
        )


# ══════════════════════════════════════════════════════════════════════════════
# 4. DOMAIN HELPERS — Songs
# ══════════════════════════════════════════════════════════════════════════════

def get_genres() -> List[Dict[str, Any]]:
    return execute_query("SELECT id, name FROM genres ORDER BY name ASC", fetch=True) or []


def get_songs(genre_id: Optional[Any] = None, is_published: Optional[bool] = True) -> List[Dict[str, Any]]:
    query = """
        SELECT s.*, g.name as genre_name
        FROM songs s
        LEFT JOIN genres g ON s.genre_id = g.id
        WHERE 1=1
    """
    params: List[Any] = []
    if is_published is not None:
        query += " AND s.is_published = %s"
        params.append(is_published)
    if genre_id:
        query += " AND s.genre_id = %s"
        params.append(int(genre_id) if str(genre_id).isdigit() else genre_id)
    query += " ORDER BY s.created_at DESC"
    return execute_query(query, params, fetch=True) or []


def get_song_by_id(song_id: Any) -> Optional[Dict[str, Any]]:
    query = """
        SELECT s.*, g.name as genre_name
        FROM songs s
        LEFT JOIN genres g ON s.genre_id = g.id
        WHERE s.id = %s
    """
    sid = int(song_id) if str(song_id).isdigit() else song_id
    return execute_query_one(query, [sid])


def create_song(song_data: Dict[str, Any]) -> Dict[str, Any]:
    fields = list(song_data.keys())
    values = list(song_data.values())
    placeholders = ["%s"] * len(fields)
    query = f"INSERT INTO songs ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
    created = execute_query_one(query, values)
    return created or song_data


def update_song(song_id: Any, song_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not song_data:
        return get_song_by_id(song_id)
    fields = list(song_data.keys())
    values = list(song_data.values())
    set_clause = ", ".join([f"{f} = %s" for f in fields])
    sid = int(song_id) if str(song_id).isdigit() else song_id
    query = f"UPDATE songs SET {set_clause} WHERE id = %s RETURNING *"
    return execute_query_one(query, values + [sid])


def delete_song(song_id: Any) -> bool:
    sid = int(song_id) if str(song_id).isdigit() else song_id
    execute_query("DELETE FROM songs WHERE id = %s", [sid])
    return True


def get_songs_by_ids(song_ids: List[Any]) -> List[Dict[str, Any]]:
    if not song_ids:
        return []
    parsed = [int(s) if str(s).isdigit() else s for s in song_ids]
    ph = ", ".join(["%s"] * len(parsed))
    return execute_query(f"SELECT id, price, title, artist FROM songs WHERE id IN ({ph})", parsed, fetch=True) or []


# ══════════════════════════════════════════════════════════════════════════════
# 5. DOMAIN HELPERS — Users / Auth
# ══════════════════════════════════════════════════════════════════════════════

def check_multiple_purchases(user_id: Any, song_ids: List[Any]) -> List[Any]:
    if not song_ids:
        return []
    uid = int(user_id) if str(user_id).isdigit() else user_id
    parsed = [int(s) if str(s).isdigit() else s for s in song_ids]
    ph = ", ".join(["%s"] * len(parsed))
    results = execute_query(
        f"SELECT song_id FROM purchases WHERE user_id = %s AND song_id IN ({ph})",
        [uid] + parsed, fetch=True
    ) or []
    return [r["song_id"] for r in results]


def check_user_purchase(user_id: Any, song_id: Any) -> bool:
    uid = int(user_id) if str(user_id).isdigit() else user_id
    sid = int(song_id) if str(song_id).isdigit() else song_id
    return execute_query_one("SELECT id FROM purchases WHERE user_id = %s AND song_id = %s", [uid, sid]) is not None


def update_user_profile(user_id: Any, full_name: str, phone: str) -> Optional[Dict[str, Any]]:
    uid = int(user_id) if str(user_id).isdigit() else user_id
    return execute_query_one(
        "UPDATE users SET full_name = %s, phone = %s WHERE id = %s RETURNING id, full_name, email, phone, is_admin, created_at",
        [full_name, phone, uid]
    )


# ══════════════════════════════════════════════════════════════════════════════
# 6. DOMAIN HELPERS — Orders / Purchases
# ══════════════════════════════════════════════════════════════════════════════

def create_order(user_id: Any, razorpay_order_id: str, total_amount: float, status: str = "created") -> Dict[str, Any]:
    uid = int(user_id) if str(user_id).isdigit() else user_id
    return execute_query_one(
        "INSERT INTO orders (user_id, razorpay_order_id, total_amount, status) VALUES (%s, %s, %s, %s) RETURNING *",
        [uid, razorpay_order_id, total_amount, status]
    ) or {}


def get_order_by_razorpay_id(razorpay_order_id: str) -> Optional[Dict[str, Any]]:
    return execute_query_one("SELECT * FROM orders WHERE razorpay_order_id = %s", [razorpay_order_id])


def update_order_status(order_id: Any, status: str, razorpay_payment_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    oid = int(order_id) if str(order_id).isdigit() else order_id
    if razorpay_payment_id:
        return execute_query_one(
            "UPDATE orders SET status = %s, razorpay_payment_id = %s WHERE id = %s RETURNING *",
            [status, razorpay_payment_id, oid]
        )
    else:
        return execute_query_one(
            "UPDATE orders SET status = %s WHERE id = %s RETURNING *",
            [status, oid]
        )


def create_order_items(order_id: Any, items: List[Dict[str, Any]]):
    oid = int(order_id) if str(order_id).isdigit() else order_id
    for item in items:
        sid = int(item["song_id"]) if str(item["song_id"]).isdigit() else item["song_id"]
        execute_query("INSERT INTO order_items (order_id, song_id, price) VALUES (%s, %s, %s)", [oid, sid, item["price"]])


def get_order_items(order_id: Any) -> List[Dict[str, Any]]:
    oid = int(order_id) if str(order_id).isdigit() else order_id
    items = execute_query(
        """
        SELECT oi.*, s.title, s.artist
        FROM order_items oi
        JOIN songs s ON oi.song_id = s.id
        WHERE oi.order_id = %s
        """,
        [oid], fetch=True
    ) or []
    for item in items:
        item["songs"] = {"title": item.pop("title", ""), "artist": item.pop("artist", "")}
    return items


def create_purchases(user_id: Any, order_id: Any, items: List[Dict[str, Any]]):
    uid = int(user_id) if str(user_id).isdigit() else user_id
    oid = int(order_id) if str(order_id).isdigit() else order_id
    for item in items:
        sid = int(item["song_id"]) if str(item["song_id"]).isdigit() else item["song_id"]
        execute_query(
            "INSERT INTO purchases (user_id, song_id, order_id) VALUES (%s, %s, %s) ON CONFLICT (user_id, song_id) DO NOTHING",
            [uid, sid, oid]
        )


def get_user_purchases(user_id: Any) -> List[Dict[str, Any]]:
    uid = int(user_id) if str(user_id).isdigit() else user_id
    return execute_query(
        """
        SELECT p.*, s.*, g.name as genre_name
        FROM purchases p
        JOIN songs s ON p.song_id = s.id
        LEFT JOIN genres g ON s.genre_id = g.id
        WHERE p.user_id = %s
        ORDER BY p.purchased_at DESC
        """,
        [uid], fetch=True
    ) or []


# ══════════════════════════════════════════════════════════════════════════════
# 7. DOMAIN HELPERS — Admin
# ══════════════════════════════════════════════════════════════════════════════

def get_admin_orders() -> List[Dict[str, Any]]:
    orders = execute_query(
        """
        SELECT o.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        """,
        fetch=True
    ) or []
    for order in orders:
        order["order_items"] = get_order_items(order["id"])
        order["profiles"] = {
            "full_name": order.pop("user_name", "Customer"),
            "email": order.pop("user_email", ""),
            "phone": order.pop("user_phone", ""),
        }
    return orders


def get_admin_stats() -> Dict[str, Any]:
    rev = execute_query_one("SELECT SUM(total_amount) as total_revenue FROM orders WHERE status = 'paid'")
    total_revenue = float(rev["total_revenue"] or 0) if rev and rev.get("total_revenue") else 0.0

    sold = execute_query_one("SELECT COUNT(*) as count FROM purchases")
    total_songs_sold = int(sold["count"] or 0) if sold else 0

    top_songs = execute_query(
        """
        SELECT s.id, s.title, s.artist,
               COUNT(p.id) as sales_count,
               SUM(oi.price) as revenue
        FROM songs s
        JOIN order_items oi ON s.id = oi.song_id
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN purchases p ON (s.id = p.song_id AND o.id = p.order_id)
        WHERE o.status = 'paid'
        GROUP BY s.id, s.title, s.artist
        ORDER BY sales_count DESC
        LIMIT 5
        """,
        fetch=True
    ) or []

    users = execute_query_one("SELECT COUNT(*) as count FROM users")
    total_users = int(users["count"] or 0) if users else 0

    bookings = execute_query_one("SELECT COUNT(*) as count FROM bookings")
    total_bookings = int(bookings["count"] or 0) if bookings else 0

    return {
        "total_revenue": total_revenue,
        "total_songs_sold": total_songs_sold,
        "top_selling_songs": top_songs,
        "recent_signups": total_users,
        "total_bookings": total_bookings,
    }


# ══════════════════════════════════════════════════════════════════════════════
# 8. DOMAIN HELPERS — Bookings
# ══════════════════════════════════════════════════════════════════════════════

def get_admin_bookings(status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    query = """
        SELECT b.*, u.full_name as user_full_name, u.email as user_account_email
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        WHERE 1=1
    """
    params: List[Any] = []
    if status_filter:
        query += " AND b.status = %s"
        params.append(status_filter)
    query += " ORDER BY b.created_at DESC"
    return execute_query(query, params, fetch=True) or []


def update_booking_status(booking_id: Any, new_status: str) -> Optional[Dict[str, Any]]:
    bid = int(booking_id) if str(booking_id).isdigit() else booking_id
    return execute_query_one(
        "UPDATE bookings SET status = %s WHERE id = %s RETURNING *",
        [new_status, bid]
    )
