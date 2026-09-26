import logging
import os
import uuid
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.auth import require_admin_user
from app.config import settings
from app.database import (
    create_song,
    delete_song,
    get_admin_orders,
    get_admin_stats,
    get_song_by_id,
    get_songs,
    update_song,
)
from app.google_drive import (
    check_drive_status,
    get_drive_links,
    parse_drive_id,
    upload_audio_to_drive,
)
from app.routers.songs import format_song_record
from app.schemas import SongUpdate

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/admin/drive/status")
def get_drive_status_route(admin_user: Dict[str, Any] = Depends(require_admin_user)):
    """Check Google Drive integration, credentials, and configured folder accessibility."""
    return check_drive_status()


@router.get("/admin/songs")
def list_admin_songs(admin_user: Dict[str, Any] = Depends(require_admin_user)):
    """Retrieve all songs in catalog (including drafts and unpublished)."""
    try:
        songs = get_songs(is_published=None)
        return [format_song_record(s) for s in songs]
    except Exception as e:
        logger.error(f"Database error loading admin songs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error loading songs: {str(e)}"
        )


@router.post("/admin/songs")
async def upload_song_admin(
    title: str = Form(...),
    artist: str = Form(...),
    album: Optional[str] = Form(None),
    price: float = Form(0.0),
    genre_id: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    lyrics: Optional[str] = Form(None),
    duration_seconds: Optional[int] = Form(None),
    is_featured: bool = Form(False),
    is_published: bool = Form(True),
    drive_file_id: Optional[str] = Form(None),
    drive_web_link: Optional[str] = Form(None),
    cover_file: Optional[UploadFile] = File(None),
    preview_file: Optional[UploadFile] = File(None),
    full_file: Optional[UploadFile] = File(None),
    admin_user: Dict[str, Any] = Depends(require_admin_user),
):
    """
    Admin Upload:
    - Automatically uploads master audio to Google Drive folder (ID: 1zur8UsA64ko5cBtXXLQl0aInPLmI2U8m).
    - Sets public access permissions.
    - Saves ONLY the Drive file ID/link + song metadata in the database.
    """
    try:
        # Default placeholder assets if no file is provided
        cover_path = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500"
        preview_path = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        full_path = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        saved_drive_id = parse_drive_id(drive_file_id or drive_web_link)
        saved_drive_web_link = drive_web_link
        saved_drive_download_link = None

        # 1. Process Cover Image Artwork
        if cover_file and cover_file.filename:
            cover_ext = cover_file.filename.split(".")[-1]
            cover_name = f"{uuid.uuid4().hex[:12]}.{cover_ext}"
            cover_bytes = await cover_file.read()

            static_cover_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "static", "covers"))
            os.makedirs(static_cover_dir, exist_ok=True)
            with open(os.path.join(static_cover_dir, cover_name), "wb") as f:
                f.write(cover_bytes)
            cover_path = f"/static/covers/{cover_name}"

        # 2. Process Master Audio File -> Automatically Upload to Google Drive Folder
        if full_file and full_file.filename:
            audio_bytes = await full_file.read()
            drive_result = upload_audio_to_drive(
                file_bytes=audio_bytes,
                filename=f"{title} - {artist}.mp3",
                mime_type=full_file.content_type or "audio/mpeg",
                folder_id=settings.google_drive_folder_id,
            )

            if drive_result.get("success"):
                saved_drive_id = drive_result.get("file_id")
                saved_drive_web_link = drive_result.get("web_view_link")
                saved_drive_download_link = drive_result.get("download_url")
                full_path = drive_result.get("stream_url")
                if not preview_file:
                    preview_path = drive_result.get("stream_url")

        # 3. Process 30s Preview File if provided separately
        if preview_file and preview_file.filename:
            preview_bytes = await preview_file.read()
            preview_result = upload_audio_to_drive(
                file_bytes=preview_bytes,
                filename=f"Preview_{title}.mp3",
                mime_type=preview_file.content_type or "audio/mpeg",
                folder_id=settings.google_drive_folder_id,
            )
            if preview_result.get("success"):
                preview_path = preview_result.get("stream_url")

        # Fallback if admin pasted a Google Drive link without file upload
        if saved_drive_id and not saved_drive_download_link:
            links = get_drive_links(saved_drive_id)
            saved_drive_web_link = saved_drive_web_link or links["drive_web_link"]
            saved_drive_download_link = links["drive_download_link"]
            if not full_path or full_path.startswith("http://localhost"):
                full_path = links["drive_stream_url"]
            if not preview_path or preview_path.startswith("http://localhost"):
                preview_path = links["drive_stream_url"]

        # 4. Save metadata + Drive references into database
        song_payload = {
            "title": title,
            "artist": artist,
            "album": album or "Music City Odia Single",
            "genre_id": genre_id if genre_id not in (None, "", "null") else None,
            "description": description,
            "lyrics": lyrics,
            "cover_image_url": cover_path,
            "drive_file_id": saved_drive_id,
            "drive_web_link": saved_drive_web_link,
            "drive_download_link": saved_drive_download_link,
            "preview_storage_path": preview_path,
            "full_storage_path": full_path,
            "price": float(price),
            "duration_seconds": duration_seconds,
            "is_featured": is_featured,
            "is_published": is_published,
        }

        created = create_song(song_payload)
        return {"status": "success", "song": format_song_record(created)}

    except Exception as e:
        logger.error(f"Admin upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Admin song upload failed: {str(e)}"
        )


@router.put("/admin/songs/{id}")
def update_song_route(
    id: str,
    payload: SongUpdate,
    admin_user: Dict[str, Any] = Depends(require_admin_user)
):
    """Update song metadata (title, artist, album, lyrics, price, status, etc.)."""
    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update")

    # If Drive ID is updated, regenerate Drive URLs
    if "drive_file_id" in update_data and update_data["drive_file_id"]:
        links = get_drive_links(update_data["drive_file_id"])
        update_data["drive_web_link"] = links["drive_web_link"]
        update_data["drive_download_link"] = links["drive_download_link"]

    updated = update_song(id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")

    return {"status": "success", "song": format_song_record(updated)}


@router.delete("/admin/songs/{id}")
def delete_song_route(
    id: str,
    admin_user: Dict[str, Any] = Depends(require_admin_user)
):
    """Delete a song from the studio catalog."""
    song = get_song_by_id(id)
    if not song:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")

    delete_song(id)
    return {"status": "success", "message": f"Song '{song.get('title')}' deleted successfully"}


@router.get("/admin/orders")
def list_admin_orders(admin_user: Dict[str, Any] = Depends(require_admin_user)):
    """List all store customer orders with transaction status and items."""
    return get_admin_orders()


@router.get("/admin/stats")
def get_admin_stats_route(admin_user: Dict[str, Any] = Depends(require_admin_user)):
    """Retrieve studio business metrics (total sales, song revenue, top sellers)."""
    return get_admin_stats()
