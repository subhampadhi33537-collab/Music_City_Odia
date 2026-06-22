from pydantic import BaseModel, Field
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

# Genre Schemas
class GenreBase(BaseModel):
    name: str

class GenreCreate(GenreBase):
    pass

class GenreResponse(GenreBase):
    id: str

    class Config:
        from_attributes = True

# Song Schemas
class SongBase(BaseModel):
    title: str
    artist: str
    genre_id: Optional[str] = None
    description: Optional[str] = None
    price: Decimal
    duration_seconds: Optional[int] = None
    is_featured: Optional[bool] = False
    is_published: Optional[bool] = True

class SongCreate(SongBase):
    pass

class SongUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    genre_id: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    duration_seconds: Optional[int] = None
    is_featured: Optional[bool] = None
    is_published: Optional[bool] = None

class SongResponse(SongBase):
    id: str
    cover_image_url: Optional[str] = None
    preview_storage_path: str
    full_storage_path: str
    created_at: datetime

    class Config:
        from_attributes = True

# Order Schemas
class OrderCreate(BaseModel):
    song_ids: List[str]


class RegisterRequest(BaseModel):
    full_name: str
    phone: str
    email: str
    password: str = Field(min_length=6)

class OrderItemResponse(BaseModel):
    id: str
    song_id: str
    price: Decimal
    song: Optional[dict] = None

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    status: str
    total_amount: Decimal
    created_at: datetime
    items: Optional[List[OrderItemResponse]] = None

    class Config:
        from_attributes = True

# Order Verification
class OrderVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# Purchase Schemas
class PurchaseResponse(BaseModel):
    id: str
    user_id: str
    song_id: str
    order_id: Optional[str] = None
    purchased_at: datetime
    song: Optional[SongResponse] = None

    class Config:
        from_attributes = True

# Admin Stats
class TopSellingSong(BaseModel):
    id: str
    title: str
    artist: str
    sales_count: int
    revenue: Decimal

class AdminStats(BaseModel):
    total_revenue: Decimal
    total_songs_sold: int
    top_selling_songs: List[TopSellingSong]
    recent_signups: int
