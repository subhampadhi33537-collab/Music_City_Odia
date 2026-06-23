import json
import datetime
import bcrypt
import jwt
from flask import Blueprint, request
from app.auth import require_current_user
from app.config import settings
from app.database import get_db_connection, release_db_connection, update_user_profile
from app.flask_utils import get_json_body, json_response
from app.http import HTTPException, status
from app.schemas import RegisterRequest

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/auth/register", methods=["POST"])
def register_user():
    payload = RegisterRequest.model_validate(get_json_body())
    
    password_hash = bcrypt.hashpw(payload.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE email = %s", (payload.email,))
        if cur.fetchone():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
            
        cur.execute("""
            INSERT INTO users (full_name, email, phone, password_hash)
            VALUES (%s, %s, %s, %s)
            RETURNING id, full_name, email, phone, is_admin
        """, (payload.full_name, payload.email, payload.phone, password_hash))
        
        user_row = cur.fetchone()
        conn.commit()
        cur.close()
        
        user_id = user_row[0]
        
        # Generate JWT for auto-login
        token_payload = {
            "sub": str(user_id),
            "email": user_row[2],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }
        token = jwt.encode(token_payload, settings.supabase_jwt_secret, algorithm="HS256")
        
        return json_response({
            "status": "success",
            "access_token": token,
            "user": {
                "id": str(user_id),
                "email": user_row[2],
            },
            "profile": {
                "id": str(user_id),
                "full_name": user_row[1],
                "phone": user_row[3],
                "is_admin": user_row[4]
            }
        }, status_code=status.HTTP_201_CREATED)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Registration failed: {str(e)}")
    finally:
        release_db_connection(conn)

@auth_bp.route("/auth/me", methods=["GET"])
@require_current_user
def get_me(current_user: dict):
    return json_response(current_user)

@auth_bp.route("/auth/profile", methods=["PUT"])
@require_current_user
def update_profile(current_user: dict):
    data = get_json_body()
    full_name = data.get("full_name")
    phone = data.get("phone")
    
    if not full_name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Full name is required")
        
    try:
        # Get ID from current_user (which should already be in our required format)
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User ID missing from session")
            
        updated_profile = update_user_profile(user_id, full_name, phone)
        if not updated_profile:
            # If not found by ID, maybe it's an email search fallback? 
            # But let's stay with ID for now as it's more secure.
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"User session valid but record not found in database for ID: {user_id}")
            
        return json_response({
            "status": "success",
            "message": "Profile updated successfully",
            "profile": updated_profile
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Failed to update profile: {str(e)}")

@auth_bp.route("/auth/login", methods=["POST"])
def login_user():
    data = get_json_body()
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email and password are required")
        
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, full_name, email, phone, password_hash, is_admin FROM users WHERE email = %s", (email,))
        user_row = cur.fetchone()
        cur.close()
        
        if not user_row or not bcrypt.checkpw(password.encode('utf-8'), user_row[4].encode('utf-8')):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
            
        user_id = user_row[0]
        
        # Generate JWT
        token_payload = {
            "sub": str(user_id),
            "email": user_row[2],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }
        token = jwt.encode(token_payload, settings.supabase_jwt_secret, algorithm="HS256")
        
        return json_response({
            "status": "success",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(user_id),
                "email": user_row[2],
            },
            "profile": {
                "id": str(user_id),
                "full_name": user_row[1],
                "phone": user_row[3],
                "is_admin": user_row[5]
            }
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Login failed: {str(e)}")
    finally:
        release_db_connection(conn)