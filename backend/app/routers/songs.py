from flask import Blueprint, request

from app.auth import require_current_user
from app.config import settings
from app.database import supabase_client
from app.flask_utils import json_response
from app.http import HTTPException, status

songs_bp = Blueprint("songs", __name__)

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
    raise HTTPException(status.HTTP_404_NOT_FOUND, "Song not found")


def format_song_record(song: dict) -> dict:
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


@songs_bp.route("/songs", methods=["GET"])
def list_songs():
    genre_id = request.args.get("genre_id")
    search = request.args.get("search")

    try:
        from app.database import get_songs
        songs = get_songs(genre_id=genre_id)

        if search:
            search_lower = search.lower()
            songs = [
                song for song in songs
                if search_lower in song.get("title", "").lower() or search_lower in song.get("artist", "").lower()
            ]

        for song in songs:
            # Map genre_name back to the expected structure for frontend compatibility
            if "genre_name" in song:
                song["genres"] = {"name": song["genre_name"]}
            format_song_record(song)

        return json_response(songs)
    except Exception as e:
        if is_mock_mode():
            return json_response([dict(MOCK_SONG)])
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Database error: {str(e)}")


@songs_bp.route("/songs/<id>", methods=["GET"])
def get_song(id: str):
    try:
        from app.database import get_song_by_id
        song = get_song_by_id(id)
        if not song:
            if is_mock_mode():
                return json_response(mock_song_or_404(id))
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Song not found")

        if "genre_name" in song:
            song["genres"] = {"name": song["genre_name"]}
        format_song_record(song)
        return json_response(song)
    except HTTPException:
        raise
    except Exception as e:
        if is_mock_mode():
            return json_response(mock_song_or_404(id))
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(e))


@songs_bp.route("/songs/<id>/download", methods=["GET"])
@require_current_user
def download_song(current_user: dict, id: str):
    user_id = current_user["id"]
    is_admin = current_user.get("is_admin", False)

    if not is_admin:
        try:
            from app.database import check_user_purchase
            if not check_user_purchase(user_id, id):
                raise HTTPException(status.HTTP_403_FORBIDDEN, "You must purchase this song to download it.")
        except HTTPException:
            raise
        except Exception as e:
            if "placeholder" in settings.supabase_service_role_key:
                raise HTTPException(status.HTTP_403_FORBIDDEN, "Mock Gate: Purchase check failed for placeholder config.")
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Database error checking purchase: {str(e)}")

    try:
        from app.database import get_song_by_id
        song = get_song_by_id(id)
        if not song:
            if is_mock_mode():
                return json_response({"download_url": MOCK_SONG["preview_url"]})
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Song not found")

        full_path = song["full_storage_path"]
        if not full_path:
             raise HTTPException(status.HTTP_404_NOT_FOUND, "Full track not available for this song")
             
        if full_path.startswith("http"):
            return json_response({"download_url": full_path})

        res = supabase_client.storage.from_("song-full").create_signed_url(full_path, 300)
        signed_url = res.get("signedURL") or res.get("url")
        return json_response({"download_url": signed_url})
    except Exception as e:
        if is_mock_mode():
            return json_response({"download_url": MOCK_SONG["preview_url"]})
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Error generating signed URL: {str(e)}")


@songs_bp.route("/songs/<id>/stream", methods=["GET"])
@require_current_user
def stream_song(current_user: dict, id: str):
    user_id = current_user["id"]
    is_admin = current_user.get("is_admin", False)

    if not is_admin:
        try:
            from app.database import check_user_purchase
            if not check_user_purchase(user_id, id):
                raise HTTPException(status.HTTP_403_FORBIDDEN, "You must purchase this song to stream it.")
        except HTTPException:
            raise
        except Exception as e:
            if "placeholder" in settings.supabase_service_role_key:
                raise HTTPException(status.HTTP_403_FORBIDDEN, "Mock Gate: Purchase check failed for placeholder config.")
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Database error checking purchase: {str(e)}")

    try:
        from app.database import get_song_by_id
        song = get_song_by_id(id)
        if not song:
            if is_mock_mode():
                return json_response({"stream_url": MOCK_SONG["preview_url"]})
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Song not found")

        full_path = song["full_storage_path"]
        if not full_path:
             raise HTTPException(status.HTTP_404_NOT_FOUND, "Full track not available for this song")

        if full_path.startswith("http"):
            return json_response({"stream_url": full_path})

        res = supabase_client.storage.from_("song-full").create_signed_url(full_path, 300)
        signed_url = res.get("signedURL") or res.get("url")
        return json_response({"stream_url": signed_url})
    except Exception as e:
        if is_mock_mode():
            return json_response({"stream_url": MOCK_SONG["preview_url"]})
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Error generating signed URL: {str(e)}")
