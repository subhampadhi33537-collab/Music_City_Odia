import logging
import uuid
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_optional_user
from app.database import execute_query_one
from app.schemas import BookingCreate

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/bookings", status_code=status.HTTP_201_CREATED)
def create_booking_route(
    payload: BookingCreate,
    current_user: Any = Depends(get_optional_user),
):
    """Submit a studio recording, dubbing, mixing, or video editing booking request."""
    user_id = current_user.get("id") if current_user else None

    try:
        res = execute_query_one(
            """
            INSERT INTO bookings (user_id, name, email, phone, service, message)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            [user_id, payload.name, payload.email or "", payload.phone, payload.service, payload.message]
        )
        booking_id = res["id"]

        return {
            "status": "success",
            "message": "Studio session booking request submitted successfully. Music City Odia team will contact you shortly.",
            "booking_id": booking_id,
        }
    except Exception as e:
        logger.error(f"Failed to submit booking: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit booking request: {str(e)}",
        )
