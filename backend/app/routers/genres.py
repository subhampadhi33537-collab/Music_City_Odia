from fastapi import APIRouter, HTTPException
from typing import List
from app.database import supabase_client
from app.config import settings

router = APIRouter(prefix="/genres", tags=["genres"])

@router.get("", response_model=List[dict])
def list_genres():
    try:
        response = supabase_client.table("genres").select("*").execute()
        return response.data or []
    except Exception as e:
        if "placeholder" in settings.supabase_service_role_key:
            return [
                {"id": "genre-1", "name": "Odia Pop"},
                {"id": "genre-2", "name": "Sambalpuri Folk"},
                {"id": "genre-3", "name": "Bhajan"},
                {"id": "genre-4", "name": "Romantic"}
            ]
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
