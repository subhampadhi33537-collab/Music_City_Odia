import logging
from typing import Optional, Dict, Any
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings
from app.database import execute_query_one

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


def verify_token(token: str) -> Dict[str, Any]:
    """Verify and decode a Supabase / Music City Odia HS256 JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """FastAPI dependency to retrieve the currently authenticated user."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(credentials.credentials)
    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing sub (user_id)",
        )

    # Fetch fresh user record from database
    try:
        user = execute_query_one(
            "SELECT id, full_name, email, phone, is_admin, created_at FROM users WHERE id = %s",
            [user_id]
        )
        if user:
            return {
                "id": str(user["id"]),
                "full_name": user["full_name"],
                "email": user["email"],
                "phone": user["phone"] or "",
                "is_admin": bool(user["is_admin"]),
                "created_at": str(user["created_at"]) if user["created_at"] else None,
            }

        # Fallback if authenticated via valid Supabase JWT but not yet in local users table
        is_admin_flag = payload.get("is_admin", False) or email == "musiccityodia@gmail.com"
        return {
            "id": str(user_id),
            "email": email or "musiccityodia@gmail.com",
            "full_name": payload.get("user_metadata", {}).get("full_name") or "Music City Admin",
            "phone": payload.get("user_metadata", {}).get("phone") or "+919937987978",
            "is_admin": bool(is_admin_flag),
        }
    except Exception as e:
        logger.error(f"Error reading user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading user profile: {str(e)}",
        )


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """Retrieve user if token is provided, otherwise return None without raising 401."""
    if not credentials or not credentials.credentials:
        return None
    try:
        return get_current_user(credentials)
    except Exception:
        return None


def require_admin_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """FastAPI dependency to ensure the user has administrator privileges."""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin role required for this studio action",
        )
    return current_user
