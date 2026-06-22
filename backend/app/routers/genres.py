from flask import Blueprint

from app.config import settings
from app.flask_utils import json_response
from app.http import HTTPException, status

genres_bp = Blueprint("genres", __name__)


@genres_bp.route("/genres", methods=["GET"])
def list_genres():
    try:
        from app.database import get_genres
        genres = get_genres()
        return json_response(genres)
    except Exception as e:
        if "placeholder" in settings.supabase_service_role_key:
            return json_response([
                {"id": "genre-1", "name": "Odia Pop"},
                {"id": "genre-2", "name": "Sambalpuri Folk"},
                {"id": "genre-3", "name": "Bhajan"},
                {"id": "genre-4", "name": "Romantic"},
            ])
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Database error: {str(e)}")
