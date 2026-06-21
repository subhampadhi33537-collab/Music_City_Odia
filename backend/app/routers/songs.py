from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.database import supabase_client
from app.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/songs", tags=["songs"])

MOCK_SONG = {
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
    "genres": {"name": "Odia Pop"},
}

def is_mock_mode() -> bool:
    return "placeholder" in settings.supabase_service_role_key

def mock_song_or_404(song_id: str) -> dict:
    if song_id == MOCK_SONG["id"]:
        return dict(MOCK_SONG)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")

def format_song_record(song: dict) -> dict:
    """Attach public preview/cover URLs to a song record."""
    if song.get("preview_storage_path") and not song["preview_storage_path"].startswith("http"):
        try:
            song["preview_url"] = supabase_client.storage.from_("song-previews").get_public_url(song["preview_storage_path"])
        except Exception:
            song["preview_url"] = f"{settings.supabase_url}/storage/v1/object/public/song-previews/{song['preview_storage_path']}"
    else:
        song["preview_url"] = song.get("preview_storage_path")

    if song.get("cover_image_url") and not song["cover_image_url"].startswith("http"):
        try:
            song["cover_url"] = supabase_client.storage.from_("song-covers").get_public_url(song["cover_image_url"])
        except Exception:
            song["cover_url"] = f"{settings.supabase_url}/storage/v1/object/public/song-covers/{song['cover_image_url']}"
    else:
        song["cover_url"] = song.get("cover_image_url")

    return song

@router.get("", response_model=List[dict])
def list_songs(
    genre_id: Optional[str] = Query(None, description="Filter by genre ID"),
    search: Optional[str] = Query(None, description="Search by title or artist"),
):
    try:
        # Build query
        query = supabase_client.table("songs").select("*, genres(name)").eq("is_published", True)
        if genre_id:
            query = query.eq("genre_id", genre_id)
        
        response = query.execute()
        songs = response.data or []
        
        # Filter search locally (PostgREST does not support clean OR queries across relation/table columns easily)
        if search:
            search_lower = search.lower()
            songs = [
                s for s in songs 
                if search_lower in s.get("title", "").lower() or search_lower in s.get("artist", "").lower()
            ]
        
        # Format storage paths to absolute URLs
        for song in songs:
            format_song_record(song)
                
        return songs
    except Exception as e:
        # Fail-soft: if supabase client is not connected properly due to placeholder keys, return empty or dummy list
        if "placeholder" in settings.supabase_service_role_key:
            return [dict(MOCK_SONG)]
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{id}", response_model=dict)
def get_song(id: str):
    try:
        response = supabase_client.table("songs").select("*, genres(name)").eq("id", id).execute()
        if not response.data or len(response.data) == 0:
            if is_mock_mode():
                return mock_song_or_404(id)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")
        
        song = response.data[0]
        format_song_record(song)
        return song
    except HTTPException:
        raise
    except Exception as e:
        if is_mock_mode():
            return mock_song_or_404(id)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}/download")
def download_song(id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    is_admin = current_user.get("is_admin", False)
    
    # 1. Ownership check (Skip if user is Admin)
    if not is_admin:
        try:
            # Query purchases table
            purchase_check = supabase_client.table("purchases").select("*").eq("user_id", user_id).eq("song_id", id).execute()
            if not purchase_check.data or len(purchase_check.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must purchase this song to download it."
                )
        except HTTPException:
            raise
        except Exception as e:
            if "placeholder" in settings.supabase_service_role_key:
                # Under local/mock setup, if purchase table doesn't exist yet, raise 403 to simulate gated access
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Mock Gate: Purchase check failed for placeholder config."
                )
            raise HTTPException(status_code=500, detail=f"Database error checking purchase: {str(e)}")
            
    # 2. Get song and create short-lived signed URL
    try:
        response = supabase_client.table("songs").select("full_storage_path").eq("id", id).execute()
        if not response.data or len(response.data) == 0:
            if is_mock_mode():
                return {"download_url": MOCK_SONG["preview_url"]}
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")
        
        full_path = response.data[0]["full_storage_path"]
        
        # If it's already a full HTTP URL, return it directly
        if full_path.startswith("http"):
            return {"download_url": full_path}
            
        # Generate signed URL (expires in 5 minutes / 300 seconds)
        res = supabase_client.storage.from_("song-full").create_signed_url(full_path, 300)
        signed_url = res.get("signedURL") or res.get("url")
        return {"download_url": signed_url}
    except Exception as e:
        if is_mock_mode():
            return {"download_url": MOCK_SONG["preview_url"]}
        raise HTTPException(status_code=500, detail=f"Error generating signed URL: {str(e)}")

@router.get("/{id}/stream")
def stream_song(id: str, current_user: dict = Depends(get_current_user)):
    # Reuses the exact same purchase verification & signed URL logic as /download
    user_id = current_user["id"]
    is_admin = current_user.get("is_admin", False)
    
    if not is_admin:
        try:
            purchase_check = supabase_client.table("purchases").select("*").eq("user_id", user_id).eq("song_id", id).execute()
            if not purchase_check.data or len(purchase_check.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must purchase this song to stream it."
                )
        except HTTPException:
            raise
        except Exception as e:
            if "placeholder" in settings.supabase_service_role_key:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Mock Gate: Purchase check failed for placeholder config."
                )
            raise HTTPException(status_code=500, detail=f"Database error checking purchase: {str(e)}")
            
    try:
        response = supabase_client.table("songs").select("full_storage_path").eq("id", id).execute()
        if not response.data or len(response.data) == 0:
            if is_mock_mode():
                return {"stream_url": MOCK_SONG["preview_url"]}
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")
        
        full_path = response.data[0]["full_storage_path"]
        
        if full_path.startswith("http"):
            return {"stream_url": full_path}
            
        res = supabase_client.storage.from_("song-full").create_signed_url(full_path, 300)
        signed_url = res.get("signedURL") or res.get("url")
        return {"stream_url": signed_url}
    except Exception as e:
        if is_mock_mode():
            return {"stream_url": MOCK_SONG["preview_url"]}
        raise HTTPException(status_code=500, detail=f"Error generating signed URL: {str(e)}")
