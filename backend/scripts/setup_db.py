import os
import psycopg2
from dotenv import load_dotenv

# Load .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DATABASE_URL = os.environ.get('DATABASE_URL')

def setup_database():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not found in .env")
        return

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # Drop existing tables
        print("Dropping existing tables...")
        cur.execute("DROP TABLE IF EXISTS purchases CASCADE;")
        cur.execute("DROP TABLE IF EXISTS order_items CASCADE;")
        cur.execute("DROP TABLE IF EXISTS orders CASCADE;")
        cur.execute("DROP TABLE IF EXISTS songs CASCADE;")
        cur.execute("DROP TABLE IF EXISTS genres CASCADE;")
        cur.execute("DROP TABLE IF EXISTS bookings CASCADE;")
        cur.execute("DROP TABLE IF EXISTS users CASCADE;")
        
        # Create users table
        print("Creating users table...")
        cur.execute("""
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                password_hash TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # Create genres table
        print("Creating genres table...")
        cur.execute("""
            CREATE TABLE genres (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            );
        """)

        # Create songs table
        print("Creating songs table...")
        cur.execute("""
            CREATE TABLE songs (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                description TEXT,
                cover_image_url TEXT,
                preview_storage_path TEXT,
                full_storage_path TEXT,
                price NUMERIC(10, 2) DEFAULT 0.00,
                genre_id INTEGER REFERENCES genres(id) ON DELETE SET NULL,
                duration_seconds INTEGER,
                is_featured BOOLEAN DEFAULT FALSE,
                is_published BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # Create orders table
        print("Creating orders table...")
        cur.execute("""
            CREATE TABLE orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                razorpay_order_id TEXT UNIQUE,
                razorpay_payment_id TEXT,
                status TEXT DEFAULT 'created',
                total_amount NUMERIC(10, 2) DEFAULT 0.00,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # Create order_items table
        print("Creating order_items table...")
        cur.execute("""
            CREATE TABLE order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                song_id INTEGER REFERENCES songs(id) ON DELETE SET NULL,
                price NUMERIC(10, 2) NOT NULL
            );
        """)

        # Create purchases table
        print("Creating purchases table...")
        cur.execute("""
            CREATE TABLE purchases (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
                order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
                purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(user_id, song_id)
            );
        """)

        # Create bookings table
        print("Creating bookings table...")
        cur.execute("""
            CREATE TABLE bookings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT NOT NULL,
                service TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # Insert some initial genres
        print("Seeding initial genres...")
        genres = ["Odia Pop", "Sambalpuri Folk", "Bhajan", "Romantic", "Devotional", "Malyalam"]
        for g in genres:
            cur.execute("INSERT INTO genres (name) VALUES (%s) ON CONFLICT DO NOTHING;", (g,))

        conn.commit()
        print("Database setup successfully!")
        cur.close()
        conn.close()

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    setup_database()
