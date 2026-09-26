from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# --- Genre Schemas ---
class GenreBase(BaseModel):
    name: str

class GenreCreate(GenreBase):
    pass

class GenreResponse(GenreBase):
    id: str

    class Config:
        from_attributes = True


# --- Song Schemas ---
class SongBase(BaseModel):
    title: str
    artist: str
    album: Optional[str] = None
    genre_id: Optional[str] = None
    description: Optional[str] = None
    lyrics: Optional[str] = None
    price: float = 0.0
    duration_seconds: Optional[int] = None
    is_featured: Optional[bool] = False
    is_published: Optional[bool] = True

class SongCreate(SongBase):
    cover_image_url: Optional[str] = None
    drive_file_id: Optional[str] = None
    drive_web_link: Optional[str] = None
    drive_download_link: Optional[str] = None
    preview_storage_path: Optional[str] = None
    full_storage_path: Optional[str] = None

class SongUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    genre_id: Optional[str] = None
    description: Optional[str] = None
    lyrics: Optional[str] = None
    price: Optional[float] = None
    duration_seconds: Optional[int] = None
    is_featured: Optional[bool] = None
    is_published: Optional[bool] = None
    cover_image_url: Optional[str] = None
    drive_file_id: Optional[str] = None
    drive_web_link: Optional[str] = None
    drive_download_link: Optional[str] = None

class SongResponse(SongBase):
    id: str
    cover_image_url: Optional[str] = None
    cover_url: Optional[str] = None
    preview_url: Optional[str] = None
    drive_file_id: Optional[str] = None
    drive_web_link: Optional[str] = None
    drive_download_link: Optional[str] = None
    drive_stream_url: Optional[str] = None
    preview_storage_path: Optional[str] = None
    full_storage_path: Optional[str] = None
    genres: Optional[Dict[str, Any]] = None
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True


# --- Auth Schemas ---
class RegisterRequest(BaseModel):
    full_name: str
    phone: Optional[str] = ""
    email: str
    password: str = Field(min_length=6)

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    full_name: str
    phone: Optional[str] = ""


# --- Order Schemas ---
class OrderCreate(BaseModel):
    song_ids: List[str]

class OrderVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class OrderItemResponse(BaseModel):
    id: str
    song_id: str
    price: float
    songs: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    status: str
    total_amount: float
    created_at: Optional[Any] = None
    order_items: Optional[List[OrderItemResponse]] = None
    profiles: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


# --- Booking Schemas ---
class BookingCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    service: str
    message: str


# --- Google Drive Schemas ---
class DriveStatusResponse(BaseModel):
    configured: bool
    folder_id: str
    folder_url: str
    auth_method: str
    storage_mode: str
    folder_name: Optional[str] = None
    folder_accessible: Optional[bool] = None
    folder_error: Optional[str] = None
