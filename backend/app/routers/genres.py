import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status

from app.database import get_genres

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/genres")
def list_genres():
    """Retrieve all Odia studio song categories and genres."""
    try:
        return get_genres()
    except Exception as e:
        logger.error(f"Error loading genres: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error loading genres: {str(e)}"
        )
