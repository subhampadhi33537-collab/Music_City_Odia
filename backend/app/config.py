import os
from pydantic_settings import BaseSettings
from pydantic import Field
from dotenv import load_dotenv, find_dotenv

# Try to load .env file if it exists
env_path = find_dotenv()
if env_path:
    load_dotenv(env_path)

class Settings(BaseSettings):
    database_url: str = Field("postgresql://postgres:postgres@localhost:5432/music_city_odia", alias="DATABASE_URL")
    supabase_url: str = Field("https://placeholder-url.supabase.co", alias="SUPABASE_URL")
    supabase_service_role_key: str = Field("placeholder-service-role-key", alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field("d6e2a986-db99-4705-a678-f8fe61f2d4c6", alias="SUPABASE_JWT_SECRET")
    razorpay_key_id: str = Field("rzp_test_placeholder", alias="RAZORPAY_KEY_ID")
    razorpay_key_secret: str = Field("placeholder-razorpay-secret", alias="RAZORPAY_KEY_SECRET")
    razorpay_webhook_secret: str = Field("placeholder-webhook-secret", alias="RAZORPAY_WEBHOOK_SECRET")
    cors_allowed_origins: str = Field(
        "https://music-city-odia.vercel.app,http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
        alias="CORS_ALLOWED_ORIGINS"
    )

    # Google Drive Song Storage Configuration
    google_drive_folder_id: str = Field("1zur8UsA64ko5cBtXXLQl0aInPLmI2U8m", alias="GOOGLE_DRIVE_FOLDER_ID")
    google_drive_service_account_file: str = Field("service_account.json", alias="GOOGLE_DRIVE_SERVICE_ACCOUNT_FILE")
    google_drive_service_account_json: str = Field("", alias="GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON")
    google_drive_api_key: str = Field("", alias="GOOGLE_DRIVE_API_KEY")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"
        populate_by_name = True

settings = Settings()
