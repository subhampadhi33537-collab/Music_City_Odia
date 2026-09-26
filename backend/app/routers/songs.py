import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse

from app.auth import get_current_user, get_optional_user
from app.config import settings
from app.database import get_songs, get_song_by_id, check_user_purchase
from app.google_drive import get_drive_links, parse_drive_id

logger = logging.getLogger(__name__)

router = APIRouter()


def format_song_record(song: Dict[str, Any]) -> Dict[str, Any]:
    """Attach canonical streaming, preview, cover, and Google Drive links to a song record."""
    drive_id = song.get("drive_file_id") or parse_drive_id(song.get("full_storage_path")) or parse_drive_id(song.get("preview_storage_path"))
    
    if drive_id:
        song["drive_file_id"] = drive_id
        drive_links = get_drive_links(drive_id)
        if not song.get("drive_web_link"):
            song["drive_web_link"] = drive_links["drive_web_link"]
        if not song.get("drive_download_link"):
            song["drive_download_link"] = drive_links["drive_download_link"]
        song["drive_stream_url"] = drive_links["drive_stream_url"]
    else:
        # Default to configured folder link
        song["drive_web_link"] = song.get("drive_web_link") or f"https://drive.google.com/drive/folders/{settings.google_drive_folder_id}"
        song["drive_stream_url"] = song.get("full_storage_path") or song.get("preview_storage_path")

    # Cover URL resolution
    cover = song.get("cover_image_url")
    if cover:
        if cover.startswith("http") or cover.startswith("/"):
            song["cover_url"] = cover
        else:
            song["cover_url"] = f"{settings.supabase_url}/storage/v1/object/public/song-covers/{cover}"
    else:
        song["cover_url"] = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500"

    # Preview URL resolution
    preview = song.get("preview_storage_path")
    if preview:
        if preview.startswith("http") or preview.startswith("/"):
            song["preview_url"] = preview
        else:
            song["preview_url"] = f"{settings.supabase_url}/storage/v1/object/public/song-previews/{preview}"
    elif drive_id:
        song["preview_url"] = f"https://docs.google.com/uc?export=open&id={drive_id}"
    else:
        song["preview_url"] = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"

    # Format genres object for frontend compatibility
    if "genre_name" in song and song["genre_name"]:
        song["genres"] = {"name": song["genre_name"]}

    # Ensure price is numeric float
    if "price" in song and song["price"] is not None:
        song["price"] = float(song["price"])

    return song


@router.get("/songs")
def list_public_songs(
    genre_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """Fetch public catalog of published Odia studio songs."""
    try:
        songs = get_songs(genre_id=genre_id, is_published=True)

        if search:
            q = search.lower().strip()
            songs = [
                s for s in songs
                if q in (s.get("title") or "").lower()
                or q in (s.get("artist") or "").lower()
                or q in (s.get("album") or "").lower()
                or q in (s.get("description") or "").lower()
            ]

        return [format_song_record(s) for s in songs]
    except Exception as e:
        logger.error(f"Error fetching songs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error loading songs: {str(e)}"
        )


@router.get("/songs/{id}")
def get_song_detail(id: str):
    """Retrieve full details of a specific song, including lyrics, album, and Drive information."""
    try:
        song = get_song_by_id(id)
        if not song:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Song not found in studio catalog"
            )
        return format_song_record(song)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error loading song {id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load song details: {str(e)}"
        )


@router.get("/songs/{id}/stream")
def stream_song(
    id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get high-fidelity stream URL for a song. Checks ownership or admin rights."""
    user_id = current_user["id"]
    is_admin = current_user.get("is_admin", False)

    song = get_song_by_id(id)
    if not song:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")

    # If song is free (price = 0) or user is admin or user purchased the song:
    price = float(song.get("price") or 0.0)
    if price > 0 and not is_admin:
        if not check_user_purchase(user_id, id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must purchase this song to stream the full studio master track."
            )

    drive_id = song.get("drive_file_id") or parse_drive_id(song.get("full_storage_path"))
    if drive_id:
        stream_url = f"https://docs.google.com/uc?export=open&id={drive_id}"
    elif song.get("full_storage_path"):
        stream_url = song["full_storage_path"]
    else:
        stream_url = song.get("preview_storage_path") or "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"

    return {"stream_url": stream_url}


@router.get("/songs/{id}/download")
def download_song(
    id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get direct high-speed download link for a full master audio track."""
    user_id = current_user["id"]
    is_admin = current_user.get("is_admin", False)

    song = get_song_by_id(id)
    if not song:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")

    price = float(song.get("price") or 0.0)
    if price > 0 and not is_admin:
        if not check_user_purchase(user_id, id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must purchase this song to download the full master track."
            )

    drive_id = song.get("drive_file_id") or parse_drive_id(song.get("full_storage_path"))
    if drive_id:
        download_url = f"https://drive.google.com/uc?export=download&id={drive_id}"
    elif song.get("drive_download_link"):
        download_url = song["drive_download_link"]
    elif song.get("full_storage_path"):
        download_url = song["full_storage_path"]
    else:
        download_url = song.get("preview_storage_path") or "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"

    return {
        "download_url": download_url,
        "title": song.get("title"),
        "artist": song.get("artist")
    }
