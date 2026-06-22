import os
import bcrypt
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def make_admin():
    name = "Subham Padhi"
    phone = "7205968855"
    email = "subhampadhi33537@gmail.com"
    password = os.getenv("ADMIN_PASSWORD", "subham33537")
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL not found in environment")
        return

    # Hash the password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if user:
            print(f"User {email} already exists. Updating to admin...")
            cur.execute("""
                UPDATE users 
                SET full_name = %s, phone = %s, is_admin = TRUE 
                WHERE email = %s
            """, (name, phone, email))
        else:
            print(f"Creating user {email} and setting as admin...")
            cur.execute("""
                INSERT INTO users (full_name, email, phone, password_hash, is_admin)
                VALUES (%s, %s, %s, %s, TRUE)
            """, (name, email, phone, password_hash))
            
        conn.commit()
        print(f"Successfully made {email} an admin.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    make_admin()
