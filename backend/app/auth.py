import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.config import settings
from app.database import supabase_client

security = HTTPBearer(auto_error=False)

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    try:
        # Supabase JWT signature is validated against the JWT secret using HS256
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(payload: dict = Security(verify_token)) -> dict:
    user_id = payload.get("sub")
    email = payload.get("email")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing sub (user_id)",
        )
    
    try:
        # Query the profile table to get is_admin flag and metadata
        response = supabase_client.table("profiles").select("*").eq("id", user_id).execute()
        if response.data and len(response.data) > 0:
            profile = response.data[0]
            profile["email"] = email
            return profile
        
        # Fallback profile if database does not contain it yet (e.g. trigger delay or custom user creation)
        return {
            "id": user_id,
            "email": email,
            "full_name": "New User",
            "phone": "",
            "is_admin": False
        }
    except Exception as e:
        # If DB connection failed (e.g., local test with placeholder key), return mock profile if we are in dev/placeholder mode
        if "placeholder" in settings.supabase_service_role_key:
            # Under mock context, check if email has "admin" in it to simulate admin role for testing
            is_admin = email is not None and "admin" in email.lower()
            return {
                "id": user_id,
                "email": email,
                "full_name": "Mock User",
                "phone": "+919937987978",
                "is_admin": is_admin
            }
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading user profile: {str(e)}"
        )

def get_admin_user(current_user: dict = Security(get_current_user)) -> dict:
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin role required",
        )
    return current_user
