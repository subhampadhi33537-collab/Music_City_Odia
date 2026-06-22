import psycopg2
from psycopg2 import pool
from app.config import settings

_pool: pool.SimpleConnectionPool | None = None

def get_db_pool() -> pool.SimpleConnectionPool:
    global _pool
    if _pool is None:
        try:
            _pool = pool.SimpleConnectionPool(
                1, 20, 
                dsn=settings.database_url
            )
        except Exception as e:
            print(f"Error creating connection pool: {e}")
            raise e
    return _pool

def get_db_connection():
    return get_db_pool().getconn()

def release_db_connection(conn):
    if _pool and conn:
        _pool.putconn(conn)

# Helper for executing queries
def execute_query(query, params=None, fetch=False):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(query, params)
        if fetch:
            columns = [desc[0] for desc in cur.description]
            results = [dict(zip(columns, row)) for row in cur.fetchall()]
            return results
        conn.commit()
        return None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        release_db_connection(conn)

# Helper for executing a query and returning one row
def execute_query_one(query, params=None):
    results = execute_query(query, params, fetch=True)
    return results[0] if results else None

# --- Genre Helpers ---
def get_genres():
    return execute_query("SELECT * FROM genres ORDER BY name ASC", fetch=True)

# --- Song Helpers ---
def get_songs(genre_id=None, is_published=True):
    query = """
        SELECT s.*, g.name as genre_name 
        FROM songs s
        LEFT JOIN genres g ON s.genre_id = g.id
        WHERE 1=1
    """
    params = []
    if is_published:
        query += " AND s.is_published = TRUE"
    if genre_id:
        query += " AND s.genre_id = %s"
        params.append(genre_id)
    
    query += " ORDER BY s.created_at DESC"
    return execute_query(query, params, fetch=True)

def get_songs_by_ids(song_ids):
    if not song_ids:
        return []
    placeholders = ", ".join(["%s"] * len(song_ids))
    query = f"SELECT id, price, title FROM songs WHERE id IN ({placeholders})"
    return execute_query(query, list(song_ids), fetch=True)

def check_multiple_purchases(user_id, song_ids):
    if not song_ids:
        return []
    placeholders = ", ".join(["%s"] * len(song_ids))
    query = f"SELECT song_id FROM purchases WHERE user_id = %s AND song_id IN ({placeholders})"
    results = execute_query(query, [user_id] + list(song_ids), fetch=True)
    return [r['song_id'] for r in results]

def get_song_by_id(song_id):
    query = """
        SELECT s.*, g.name as genre_name 
        FROM songs s
        LEFT JOIN genres g ON s.genre_id = g.id
        WHERE s.id = %s
    """
    return execute_query_one(query, (song_id,))

def create_song(song_data):
    fields = ", ".join(song_data.keys())
    placeholders = ", ".join(["%s"] * len(song_data))
    query = f"INSERT INTO songs ({fields}) VALUES ({placeholders}) RETURNING *"
    return execute_query_one(query, list(song_data.values()))

def update_song(song_id, song_data):
    updates = ", ".join([f"{k} = %s" for k in song_data.keys()])
    query = f"UPDATE songs SET {updates} WHERE id = %s RETURNING *"
    params = list(song_data.values()) + [song_id]
    return execute_query_one(query, params)

def delete_song(song_id):
    return execute_query("DELETE FROM songs WHERE id = %s", (song_id,))

# --- Order Helpers ---
def create_order(user_id, razorpay_order_id, total_amount, status='created'):
    query = """
        INSERT INTO orders (user_id, razorpay_order_id, total_amount, status)
        VALUES (%s, %s, %s, %s) RETURNING *
    """
    return execute_query_one(query, (user_id, razorpay_order_id, total_amount, status))

def get_order_by_razorpay_id(razorpay_order_id):
    query = "SELECT * FROM orders WHERE razorpay_order_id = %s"
    return execute_query_one(query, (razorpay_order_id,))

def update_order_status(order_id, status, razorpay_payment_id=None):
    if razorpay_payment_id:
        query = "UPDATE orders SET status = %s, razorpay_payment_id = %s WHERE id = %s RETURNING *"
        return execute_query_one(query, (status, razorpay_payment_id, order_id))
    else:
        query = "UPDATE orders SET status = %s WHERE id = %s RETURNING *"
        return execute_query_one(query, (status, order_id))

# --- Order Item Helpers ---
def create_order_items(order_id, items):
    for item in items:
        query = "INSERT INTO order_items (order_id, song_id, price) VALUES (%s, %s, %s)"
        execute_query(query, (order_id, item['song_id'], item['price']))

def get_order_items(order_id):
    query = """
        SELECT oi.*, s.title, s.artist 
        FROM order_items oi
        JOIN songs s ON oi.song_id = s.id
        WHERE oi.order_id = %s
    """
    items = execute_query(query, (order_id,), fetch=True)
    for item in items:
        # Nest song info into 'songs' for frontend compatibility
        item['songs'] = {
            'title': item.pop('title'),
            'artist': item.pop('artist')
        }
    return items

# --- Purchase Helpers ---
def create_purchases(user_id, order_id, items):
    for item in items:
        query = """
            INSERT INTO purchases (user_id, song_id, order_id)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id, song_id) DO NOTHING
        """
        execute_query(query, (user_id, item['song_id'], order_id))

def get_user_purchases(user_id):
    query = """
        SELECT p.*, s.*, g.name as genre_name
        FROM purchases p
        JOIN songs s ON p.song_id = s.id
        LEFT JOIN genres g ON s.genre_id = g.id
        WHERE p.user_id = %s
        ORDER BY p.purchased_at DESC
    """
    return execute_query(query, (user_id,), fetch=True)

def check_user_purchase(user_id, song_id):
    query = "SELECT 1 FROM purchases WHERE user_id = %s AND song_id = %s"
    return execute_query_one(query, (user_id, song_id)) is not None

# --- Admin Helpers ---
def get_admin_orders():
    query = """
        SELECT o.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
    """
    orders = execute_query(query, fetch=True)
    for order in orders:
        order['order_items'] = get_order_items(order['id'])
        # Nest user info into 'profiles' for frontend compatibility (matches Supabase format)
        order['profiles'] = {
            'full_name': order.pop('user_name'),
            'email': order.pop('user_email'),
            'phone': order.pop('user_phone')
        }
    return orders

def get_admin_stats():
    # Paid orders revenue
    rev_query = "SELECT SUM(total_amount) as total_revenue FROM orders WHERE status = 'paid'"
    total_revenue = execute_query_one(rev_query)['total_revenue'] or 0.00
    
    # Total songs sold
    songs_sold_query = "SELECT COUNT(*) as count FROM purchases"
    total_songs_sold = execute_query_one(songs_sold_query)['count'] or 0
    
    # Top selling songs
    top_songs_query = """
        SELECT s.id, s.title, s.artist, COUNT(p.id) as sales_count, SUM(oi.price) as revenue
        FROM songs s
        JOIN order_items oi ON s.id = oi.song_id
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN purchases p ON (s.id = p.song_id AND o.id = p.order_id)
        WHERE o.status = 'paid'
        GROUP BY s.id, s.title, s.artist
        ORDER BY sales_count DESC
        LIMIT 5
    """
    top_selling_songs = execute_query(top_songs_query, fetch=True)
    
    # Recent signups (last 7 days)
    signups_query = "SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"
    recent_signups = execute_query_one(signups_query)['count'] or 0
    
    return {
        "total_revenue": float(total_revenue),
        "total_songs_sold": int(total_songs_sold),
        "top_selling_songs": top_selling_songs,
        "recent_signups": int(recent_signups)
    }

# Keeping Supabase Client ONLY for Storage (Mocked for now as requested)
class MockSupabaseClient:
    def __init__(self):
        self.storage = self
        
    def from_(self, bucket):
        self.bucket = bucket
        return self
        
    def get_public_url(self, path):
        # We can still use the environment variables if they exist, or return a placeholder
        from app.config import settings
        if "placeholder" not in settings.supabase_url:
            return f"{settings.supabase_url}/storage/v1/object/public/{self.bucket}/{path}"
        return f"https://placeholder.com/{path}"
    
    def create_signed_url(self, path, expires_in):
        from app.config import settings
        # In a real scenario, we'd use the actual client, but for this migration:
        return {"signedURL": f"https://placeholder.com/{path}?token=mock"}

    def upload(self, path, file, file_options=None):
        print(f"Mock Upload to {self.bucket}/{path}")
        return {"path": path}

    def remove(self, paths):
        print(f"Mock Remove from {self.bucket}: {paths}")
        return {"data": paths}

supabase_client = MockSupabaseClient()
