"""
Direct PostgreSQL Database Setup Script for Music City Odia (Supabase)
Run: python scripts/setup_postgres.py
"""
import os
import sys
import bcrypt
import psycopg2
from dotenv import load_dotenv

# Load backend/.env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(env_path)

DATABASE_URL = os.environ.get("DATABASE_URL")
GOOGLE_DRIVE_FOLDER_ID = os.environ.get("GOOGLE_DRIVE_FOLDER_ID", "1zur8UsA64ko5cBtXXLQl0aInPLmI2U8m")
ADMIN_EMAIL = "musiccityodia@gmail.com"
ADMIN_PASSWORD = "musiccityodia12345"


def setup():
    print("=" * 60)
    print("  MUSIC CITY ODIA - SUPABASE POSTGRESQL SETUP")
    print("=" * 60)
    print(f"Connecting to PostgreSQL using DATABASE_URL in: {env_path}")
    
    if not DATABASE_URL:
        print("[ERROR] DATABASE_URL is not set in backend/.env!")
        sys.exit(1)

    try:
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=10)
        cur = conn.cursor()
        print("[OK] Connected to PostgreSQL successfully!")

        # 1. Create Tables
        print("\nCreating / verifying PostgreSQL schema...")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                password_hash TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS genres (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            );

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

            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                razorpay_order_id TEXT UNIQUE,
                razorpay_payment_id TEXT,
                status TEXT DEFAULT 'created',
                total_amount NUMERIC(10, 2) DEFAULT 0.00,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                song_id INTEGER REFERENCES songs(id) ON DELETE SET NULL,
                price NUMERIC(10, 2) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS purchases (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
                order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
                purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(user_id, song_id)
            );

            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT NOT NULL,
                service TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        conn.commit()
        print("[OK] Tables created or verified.")

        # 2. Seed Genres
        print("\nSeeding genres...")
        genres = [
            "Odia Pop",
            "Sambalpuri Folk",
            "Bhajan & Devotional",
            "Romantic Hits",
            "Modern Studio Odia",
            "Classical Odia",
        ]
        for g in genres:
            cur.execute("INSERT INTO genres (name) VALUES (%s) ON CONFLICT (name) DO NOTHING", [g])
        conn.commit()
        print(f"[OK] Seeded {len(genres)} genres.")

        # 3. Seed / Update Admin Account
        print("\nConfiguring Admin User...")
        hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        cur.execute("SELECT id FROM users WHERE email = %s", [ADMIN_EMAIL])
        existing_admin = cur.fetchone()

        if existing_admin:
            cur.execute(
                "UPDATE users SET password_hash = %s, is_admin = TRUE WHERE email = %s",
                [hashed, ADMIN_EMAIL]
            )
            print(f"[OK] Updated existing admin: {ADMIN_EMAIL}")
        else:
            cur.execute(
                """
                INSERT INTO users (full_name, email, phone, password_hash, is_admin)
                VALUES (%s, %s, %s, %s, TRUE)
                """,
                ["Music City Admin", ADMIN_EMAIL, "+919937987978", hashed]
            )
            print(f"[OK] Created new admin user: {ADMIN_EMAIL}")
        conn.commit()

        # 4. Seed Studio Demo Track with Google Drive folder link
        cur.execute("SELECT COUNT(*) FROM songs")
        count = cur.fetchone()[0]
        if count == 0:
            cur.execute("SELECT id FROM genres LIMIT 1")
            gid = cur.fetchone()[0]
            cur.execute("""
                INSERT INTO songs (
                    title, artist, album, genre_id, description, lyrics,
                    cover_image_url, drive_file_id, drive_web_link, drive_download_link,
                    preview_storage_path, full_storage_path, price, duration_seconds,
                    is_featured, is_published
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, [
                "Mu Odia Toka (Super Bass Mix)",
                "Music City Singer",
                "Super Bass Odia Vol. 1",
                gid,
                "The chartbuster Odia anthem recorded at Music City Odia Super Bass Sound Studio.",
                "ମୁଁ ଓଡ଼ିଆ ଟୋକା, ଛାତି ମୋର ଚଉଡ଼ା...\nମାଟି ମୋର ଜନ୍ମଭୂମି, ଜଗନ୍ନାଥ ସାହା...",
                "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600",
                GOOGLE_DRIVE_FOLDER_ID,
                f"https://drive.google.com/drive/folders/{GOOGLE_DRIVE_FOLDER_ID}",
                "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                19.00,
                240,
                True,
                True
            ])
            conn.commit()
            print("[OK] Seeded initial studio track with Google Drive link.")

        cur.close()
        conn.close()

        print("\n" + "=" * 60)
        print("  DATABASE SETUP COMPLETE!")
        print(f"  Admin Email:    {ADMIN_EMAIL}")
        print(f"  Admin Password: {ADMIN_PASSWORD}")
        print(f"  Drive Folder:   {GOOGLE_DRIVE_FOLDER_ID}")
        print("=" * 60)

    except Exception as e:
        print(f"\n[POSTGRES ERROR] {e}")
        print("\nSupabase Troubleshooting:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Check if your project is 'Paused'. If paused, click 'Restore project'.")
        print("3. Check 'Project Settings' > 'Database' > 'Connection string' (URI format).")
        print("4. Paste the URI into backend/.env as DATABASE_URL.")


if __name__ == "__main__":
    setup()
