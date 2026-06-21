from pydantic_settings import BaseSettings
from pydantic import Field
from dotenv import load_dotenv, find_dotenv

# Try to load .env file if it exists
env_path = find_dotenv()
if env_path:
    load_dotenv(env_path)

class Settings(BaseSettings):
    supabase_url: str = Field("https://placeholder-url.supabase.co", alias="SUPABASE_URL")
    supabase_service_role_key: str = Field("placeholder-service-role-key", alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field("placeholder-jwt-secret-long-enough-for-hs256-requirements-123456", alias="SUPABASE_JWT_SECRET")
    razorpay_key_id: str = Field("rzp_test_placeholder", alias="RAZORPAY_KEY_ID")
    razorpay_key_secret: str = Field("placeholder-razorpay-secret", alias="RAZORPAY_KEY_SECRET")
    razorpay_webhook_secret: str = Field("placeholder-webhook-secret", alias="RAZORPAY_WEBHOOK_SECRET")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"
        populate_by_name = True

settings = Settings()
