from functools import wraps
import jwt
from flask import request
from app.config import settings
from app.database import get_db_connection, release_db_connection
from app.http import HTTPException, status

def verify_token() -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authorization header is missing")

    token = auth_header.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid authentication credentials: {str(e)}")

def get_current_user() -> dict:
    payload = verify_token()
    user_id = payload.get("sub")
    email = payload.get("email")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token payload: missing sub (user_id)")

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, full_name, email, phone, is_admin, created_at FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        cur.close()
        
        if user:
            return {
                "id": str(user[0]),
                "full_name": user[1],
                "email": user[2],
                "phone": user[3],
                "is_admin": user[4],
                "created_at": user[5].isoformat() if user[5] else None
            }

        # Fallback for JWTs that might exist but not be in our DB yet (if any)
        return {
            "id": str(user_id),
            "email": email,
            "full_name": "New User",
            "phone": "",
            "is_admin": False,
        }
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Error reading user profile: {str(e)}")
    finally:
        release_db_connection(conn)

def require_current_user(view_function):
    @wraps(view_function)
    def wrapper(*args, **kwargs):
        current_user = get_current_user()
        return view_function(current_user, *args, **kwargs)
    return wrapper

def require_admin_user(view_function):
    @wraps(view_function)
    def wrapper(*args, **kwargs):
        current_user = get_current_user()
        if not current_user.get("is_admin"):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Access forbidden: Admin role required")
        return view_function(current_user, *args, **kwargs)
    return wrapper
