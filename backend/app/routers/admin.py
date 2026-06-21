from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import Optional, List
from decimal import Decimal
import uuid
import datetime
from app.database import supabase_client
from app.auth import get_admin_user
from app.config import settings
from app.schemas import SongUpdate
from app.routers.songs import format_song_record

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/songs", response_model=List[dict])
def list_admin_songs(admin_user: dict = Depends(get_admin_user)):
    try:
        response = supabase_client.table("songs").select("*, genres(name)").order("created_at", desc=True).execute()
        songs = response.data or []
        for song in songs:
            format_song_record(song)
        return songs
    except Exception as e:
        if "placeholder" in settings.supabase_service_role_key:
            return [
                {
                    "id": "mock-song-1",
                    "title": "Mu Odia Toka",
                    "artist": "Music City Singer",
                    "description": "Super Hit Odia Single",
                    "cover_url": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
                    "preview_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                    "price": 19.00,
                    "duration_seconds": 240,
                    "is_featured": True,
                    "is_published": True,
                    "genres": {"name": "Odia Pop"}
                }
            ]
        raise HTTPException(status_code=500, detail=f"Database error loading songs: {str(e)}")

@router.post("/songs", response_model=dict)
async def upload_song(
    title: str = Form(...),
    artist: str = Form(...),
    price: float = Form(...),
    genre_id: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    duration_seconds: Optional[int] = Form(None),
    is_featured: bool = Form(False),
    is_published: bool = Form(True),
    cover_file: Optional[UploadFile] = File(None),
    preview_file: Optional[UploadFile] = File(None),
    full_file: Optional[UploadFile] = File(None),
    admin_user: dict = Depends(get_admin_user)
):
    try:
        # Default mock paths if no files are supplied
        cover_path = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500"
        preview_path = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        full_path = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        
        # 1. Upload Cover Image (Public Bucket)
        if cover_file:
            cover_ext = cover_file.filename.split(".")[-1]
            cover_name = f"{uuid.uuid4()}.{cover_ext}"
            cover_bytes = await cover_file.read()
            
            if "placeholder" in settings.supabase_service_role_key:
                cover_path = f"mock-covers/{cover_name}"
            else:
                try:
                    supabase_client.storage.from_("song-covers").upload(
                        path=cover_name,
                        file=cover_bytes,
                        file_options={"content-type": cover_file.content_type}
                    )
                    cover_path = cover_name
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to upload cover art: {str(e)}")
                    
        # 2. Upload Preview Audio Clip (Public Bucket)
        if preview_file:
            preview_ext = preview_file.filename.split(".")[-1]
            preview_name = f"{uuid.uuid4()}.{preview_ext}"
            preview_bytes = await preview_file.read()
            
            if "placeholder" in settings.supabase_service_role_key:
                preview_path = f"mock-previews/{preview_name}"
            else:
                try:
                    supabase_client.storage.from_("song-previews").upload(
                        path=preview_name,
                        file=preview_bytes,
                        file_options={"content-type": preview_file.content_type}
                    )
                    preview_path = preview_name
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to upload preview file: {str(e)}")
                    
        # 3. Upload Full Audio Track (Private Bucket)
        if full_file:
            full_ext = full_file.filename.split(".")[-1]
            full_name = f"{uuid.uuid4()}.{full_ext}"
            full_bytes = await full_file.read()
            
            if "placeholder" in settings.supabase_service_role_key:
                full_path = f"mock-full/{full_name}"
            else:
                try:
                    supabase_client.storage.from_("song-full").upload(
                        path=full_name,
                        file=full_bytes,
                        file_options={"content-type": full_file.content_type}
                    )
                    full_path = full_name
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to upload full audio track: {str(e)}")
                    
        # 4. Save Song record to DB
        song_payload = {
            "title": title,
            "artist": artist,
            "genre_id": genre_id if genre_id and genre_id != "null" else None,
            "description": description,
            "cover_image_url": cover_path,
            "preview_storage_path": preview_path,
            "full_storage_path": full_path,
            "price": price,
            "duration_seconds": duration_seconds,
            "is_featured": is_featured,
            "is_published": is_published
        }
        
        insert_resp = supabase_client.table("songs").insert(song_payload).execute()
        
        if insert_resp.data and len(insert_resp.data) > 0:
            return {"status": "success", "song": insert_resp.data[0]}
        
        if "placeholder" in settings.supabase_service_role_key:
            return {"status": "success", "song": {**song_payload, "id": f"song_mock_{uuid.uuid4().hex[:8]}"}}
            
        raise HTTPException(status_code=500, detail="Failed to insert song record in database")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Admin upload failed: {str(e)}")

@router.put("/songs/{id}", response_model=dict)
def update_song(
    id: str,
    payload: SongUpdate,
    admin_user: dict = Depends(get_admin_user)
):
    try:
        # Only send non-None fields to the update
        update_data = payload.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        update_resp = supabase_client.table("songs").update(update_data).eq("id", id).execute()
        if update_resp.data and len(update_resp.data) > 0:
            return {"status": "success", "song": update_resp.data[0]}
            
        if "placeholder" in settings.supabase_service_role_key:
            return {"status": "success", "song": {**update_data, "id": id}}
            
        raise HTTPException(status_code=404, detail="Song not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

@router.delete("/songs/{id}")
def delete_song(id: str, admin_user: dict = Depends(get_admin_user)):
    try:
        # Retrieve song info to clean files from storage
        song_resp = supabase_client.table("songs").select("cover_image_url, preview_storage_path, full_storage_path").eq("id", id).execute()
        
        if song_resp.data and len(song_resp.data) > 0:
            song = song_resp.data[0]
            
            # Clean storage files (if not mock HTTP URLs)
            if not "placeholder" in settings.supabase_service_role_key:
                try:
                    if song.get("cover_image_url") and not song["cover_image_url"].startswith("http"):
                        supabase_client.storage.from_("song-covers").remove([song["cover_image_url"]])
                    if song.get("preview_storage_path") and not song["preview_storage_path"].startswith("http"):
                        supabase_client.storage.from_("song-previews").remove([song["preview_storage_path"]])
                    if song.get("full_storage_path") and not song["full_storage_path"].startswith("http"):
                        supabase_client.storage.from_("song-full").remove([song["full_storage_path"]])
                except Exception:
                    pass # Ignore storage cleanup errors and continue with database deletion
                    
        supabase_client.table("songs").delete().eq("id", id).execute()
        return {"status": "success", "message": "Song deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

@router.get("/orders", response_model=List[dict])
def list_admin_orders(admin_user: dict = Depends(get_admin_user)):
    try:
        response = supabase_client.table("orders").select("*, profiles(*), order_items(*, songs(*))").order("created_at", desc=True).execute()
        return response.data or []
    except Exception as e:
        if "placeholder" in settings.supabase_service_role_key:
            # Mock orders history
            return [
                {
                    "id": "order-1",
                    "razorpay_order_id": "order_mock_12345",
                    "razorpay_payment_id": "pay_mock_12345",
                    "status": "paid",
                    "total_amount": 19.00,
                    "created_at": "2026-06-21T10:00:00Z",
                    "profiles": {
                        "full_name": "Test Customer",
                        "phone": "+919937987978"
                    },
                    "order_items": [
                        {
                            "price": 19.00,
                            "songs": {
                                "title": "Mu Odia Toka",
                                "artist": "Music City Singer"
                            }
                        }
                    ]
                }
            ]
        raise HTTPException(status_code=500, detail=f"Database error loading orders: {str(e)}")

@router.get("/stats", response_model=dict)
def get_admin_stats(admin_user: dict = Depends(get_admin_user)):
    try:
        # Load all paid orders
        orders_resp = supabase_client.table("orders").select("*").eq("status", "paid").execute()
        orders = orders_resp.data or []
        
        # Load all purchases joined with song info
        purchases_resp = supabase_client.table("purchases").select("*, songs(id, title, artist)").execute()
        purchases = purchases_resp.data or []

        items_resp = supabase_client.table("order_items").select("order_id, song_id, price").execute()
        price_lookup = {
            (item["order_id"], item["song_id"]): float(item["price"])
            for item in (items_resp.data or [])
        }
        
        # Load profile counts
        profiles_resp = supabase_client.table("profiles").select("id, created_at").execute()
        profiles = profiles_resp.data or []
        
        # Calculate stats
        total_revenue = sum(float(order["total_amount"]) for order in orders)
        total_songs_sold = len(purchases)
        
        # Calculate top selling songs
        song_sales = {}
        for p in purchases:
            song = p.get("songs")
            if song:
                s_id = song["id"]
                if s_id not in song_sales:
                    song_sales[s_id] = {
                        "id": s_id,
                        "title": song["title"],
                        "artist": song["artist"],
                        "sales_count": 0,
                        "revenue": Decimal(0.0)
                    }
                song_sales[s_id]["sales_count"] += 1
                sale_price = price_lookup.get((p.get("order_id"), s_id), 0)
                song_sales[s_id]["revenue"] += Decimal(str(sale_price))
                
        top_selling = sorted(song_sales.values(), key=lambda x: x["sales_count"], reverse=True)[:5]
        
        # Signups in the last 7 days
        seven_days_ago = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)
        recent_signups = 0
        for p in profiles:
            try:
                # parse created_at ISO string
                dt_str = p["created_at"].replace("Z", "+00:00")
                dt = datetime.datetime.fromisoformat(dt_str)
                if dt >= seven_days_ago:
                    recent_signups += 1
            except Exception:
                recent_signups += 1 # fallback
                
        return {
            "total_revenue": total_revenue,
            "total_songs_sold": total_songs_sold,
            "top_selling_songs": top_selling,
            "recent_signups": recent_signups
        }
    except Exception as e:
        if "placeholder" in settings.supabase_service_role_key:
            return {
                "total_revenue": 190.00,
                "total_songs_sold": 10,
                "top_selling_songs": [
                    {
                        "id": "mock-song-1",
                        "title": "Mu Odia Toka",
                        "artist": "Music City Singer",
                        "sales_count": 10,
                        "revenue": 190.00
                    }
                ],
                "recent_signups": 5
            }
        raise HTTPException(status_code=500, detail=f"Database error loading statistics: {str(e)}")
