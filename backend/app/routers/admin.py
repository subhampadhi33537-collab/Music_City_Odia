from decimal import Decimal
import datetime
import uuid

from flask import Blueprint, request

from app.auth import require_admin_user
from app.config import settings
from app.database import supabase_client, get_songs, create_song, update_song, get_song_by_id, delete_song, get_admin_orders, get_admin_stats
from app.flask_utils import json_response
from app.http import HTTPException, status
from app.routers.songs import format_song_record
from app.schemas import SongUpdate

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/admin/songs", methods=["GET"])
@require_admin_user
def list_admin_songs(admin_user: dict):
    try:
        songs = get_songs(is_published=None) # Get all for admin

        for song in songs:
            if "genre_name" in song:
                song["genres"] = {"name": song["genre_name"]}
            format_song_record(song)
        return json_response(songs)
    except Exception as e:
        if "placeholder" in settings.supabase_service_role_key:
            return json_response([
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
                    "genres": {"name": "Odia Pop"},
                }
            ])
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Database error loading songs: {str(e)}")


@admin_bp.route("/admin/songs", methods=["POST"])
@require_admin_user
def upload_song(admin_user: dict):
    try:
        form = request.form
        files = request.files

        title = form.get("title")
        artist = form.get("artist")
        price = float(form.get("price", "0"))
        genre_id = form.get("genre_id")
        description = form.get("description")
        duration_seconds = form.get("duration_seconds")
        duration_seconds = int(duration_seconds) if duration_seconds not in (None, "", "null") else None
        is_featured = form.get("is_featured", "false").lower() in {"1", "true", "yes", "on"}
        is_published = form.get("is_published", "true").lower() in {"1", "true", "yes", "on"}
        cover_file = files.get("cover_file")
        preview_file = files.get("preview_file")
        full_file = files.get("full_file")

        cover_path = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500"
        preview_path = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        full_path = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"

        if cover_file:
            cover_ext = cover_file.filename.split(".")[-1]
            cover_name = f"{uuid.uuid4()}.{cover_ext}"
            cover_bytes = cover_file.read()

            if "placeholder" in settings.supabase_service_role_key:
                cover_path = f"mock-covers/{cover_name}"
            else:
                try:
                    supabase_client.storage.from_("song-covers").upload(
                        path=cover_name,
                        file=cover_bytes,
                        file_options={"content-type": cover_file.content_type},
                    )
                    cover_path = cover_name
                except Exception as e:
                    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Failed to upload cover art: {str(e)}")

        if preview_file:
            preview_ext = preview_file.filename.split(".")[-1]
            preview_name = f"{uuid.uuid4()}.{preview_ext}"
            preview_bytes = preview_file.read()

            if "placeholder" in settings.supabase_service_role_key:
                preview_path = f"mock-previews/{preview_name}"
            else:
                try:
                    supabase_client.storage.from_("song-previews").upload(
                        path=preview_name,
                        file=preview_bytes,
                        file_options={"content-type": preview_file.content_type},
                    )
                    preview_path = preview_name
                except Exception as e:
                    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Failed to upload preview file: {str(e)}")

        if full_file:
            full_ext = full_file.filename.split(".")[-1]
            full_name = f"{uuid.uuid4()}.{full_ext}"
            full_bytes = full_file.read()

            if "placeholder" in settings.supabase_service_role_key:
                full_path = f"mock-full/{full_name}"
            else:
                try:
                    supabase_client.storage.from_("song-full").upload(
                        path=full_name,
                        file=full_bytes,
                        file_options={"content-type": full_file.content_type},
                    )
                    full_path = full_name
                except Exception as e:
                    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Failed to upload full audio track: {str(e)}")

        song_payload = {
            "title": title,
            "artist": artist,
            "genre_id": int(genre_id) if genre_id and genre_id != "null" else None,
            "description": description,
            "cover_image_url": cover_path,
            "preview_storage_path": preview_path,
            "full_storage_path": full_path,
            "price": price,
            "duration_seconds": duration_seconds,
            "is_featured": is_featured,
            "is_published": is_published,
        }

        inserted_song = create_song(song_payload)

        if inserted_song:
            return json_response({"status": "success", "song": inserted_song})

        if "placeholder" in settings.supabase_service_role_key:
            return json_response({"status": "success", "song": {**song_payload, "id": 1}})

        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to insert song record in database")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Admin upload failed: {str(e)}")


@admin_bp.route("/admin/songs/<id>", methods=["PUT"])
@require_admin_user
def update_song(admin_user: dict, id: str):
    try:
        payload = SongUpdate.model_validate(request.get_json(silent=True) or {})
        update_data = payload.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update")
        update_resp = update_song(id, update_data)
        if update_resp:
            return json_response({"status": "success", "song": update_resp})

        if "placeholder" in settings.supabase_service_role_key:
            return json_response({"status": "success", "song": {**update_data, "id": id}})

        raise HTTPException(status.HTTP_404_NOT_FOUND, "Song not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Update failed: {str(e)}")


@admin_bp.route("/admin/songs/<id>", methods=["DELETE"])
@require_admin_user
def delete_song(admin_user: dict, id: str):
    try:
        song = get_song_by_id(id)

        if song:
            if "placeholder" not in settings.supabase_service_role_key:
                try:
                    if song.get("cover_image_url") and not song["cover_image_url"].startswith("http"):
                        supabase_client.storage.from_("song-covers").remove([song["cover_image_url"]])
                    if song.get("preview_storage_path") and not song["preview_storage_path"].startswith("http"):
                        supabase_client.storage.from_("song-previews").remove([song["preview_storage_path"]])
                    if song.get("full_storage_path") and not song["full_storage_path"].startswith("http"):
                        supabase_client.storage.from_("song-full").remove([song["full_storage_path"]])
                except Exception:
                    pass

        delete_song(id)
        return json_response({"status": "success", "message": "Song deleted successfully"})
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Delete failed: {str(e)}")


@admin_bp.route("/admin/orders", methods=["GET"])
@require_admin_user
def list_admin_orders(admin_user: dict):
    try:
        orders = get_admin_orders()
        return json_response(orders)
    except Exception as e:
        if "placeholder" in settings.supabase_service_role_key:
            return json_response([
                {
                    "id": "order-1",
                    "razorpay_order_id": "order_mock_12345",
                    "razorpay_payment_id": "pay_mock_12345",
                    "status": "paid",
                    "total_amount": 19.00,
                    "created_at": "2026-06-21T10:00:00Z",
                    "profiles": {"full_name": "Test Customer", "phone": "+919937987978"},
                    "order_items": [
                        {"price": 19.00, "songs": {"title": "Mu Odia Toka", "artist": "Music City Singer"}}
                    ],
                }
            ])
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Database error loading orders: {str(e)}")


@admin_bp.route("/admin/stats", methods=["GET"])
@require_admin_user
def get_admin_stats_route(admin_user: dict):
    try:
        stats = get_admin_stats()
        return json_response(stats)
    except Exception as e:
        if "placeholder" in settings.supabase_service_role_key:
            return json_response(
                {
                    "total_revenue": 190.00,
                    "total_songs_sold": 10,
                    "top_selling_songs": [
                        {
                            "id": "mock-song-1",
                            "title": "Mu Odia Toka",
                            "artist": "Music City Singer",
                            "sales_count": 10,
                            "revenue": 190.00,
                        }
                    ],
                    "recent_signups": 5,
                }
            )
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Database error loading statistics: {str(e)}")
