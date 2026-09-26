import logging
import uuid
from typing import Dict, Any

import razorpay
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.config import settings
from app.database import (
    check_multiple_purchases,
    create_order,
    create_order_items,
    create_purchases,
    get_order_by_razorpay_id,
    get_order_items,
    get_songs_by_ids,
    get_user_purchases,
    update_order_status,
)
from app.routers.songs import format_song_record
from app.schemas import OrderCreate, OrderVerify

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/orders")
def create_order_route(
    payload: OrderCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Initiate a studio store order for purchasing tracks."""
    user_id = current_user["id"]
    song_ids = payload.song_ids

    if not song_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No songs specified in cart"
        )

    # 1. Fetch songs and calculate total amount
    songs = get_songs_by_ids(song_ids)
    if not songs or len(songs) != len(song_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more songs in your cart are invalid or no longer available"
        )

    total_amount = sum(float(s["price"]) for s in songs)

    # 2. Check if user already owns any of these tracks
    owned_ids = check_multiple_purchases(user_id, song_ids)
    if owned_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already own one or more tracks in your cart"
        )

    # 3. Create Razorpay order (or mock dev order)
    if "placeholder" in settings.razorpay_key_id:
        mock_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
        inserted = create_order(user_id, mock_order_id, total_amount, status="created")
        items = [{"song_id": s["id"], "price": float(s["price"])} for s in songs]
        create_order_items(inserted["id"], items)

        return {
            "id": inserted["id"],
            "razorpay_order_id": mock_order_id,
            "amount": total_amount,
            "currency": "INR",
            "razorpay_key_id": settings.razorpay_key_id,
            "is_mock": True,
        }

    try:
        client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
        razorpay_order = client.order.create({
            "amount": int(total_amount * 100),  # paise
            "currency": "INR",
            "receipt": f"receipt_{uuid.uuid4().hex[:8]}",
        })
        razorpay_order_id = razorpay_order["id"]
    except Exception as rz_err:
        logger.error(f"Razorpay order creation failed: {rz_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment gateway order creation failed: {str(rz_err)}"
        )

    inserted = create_order(user_id, razorpay_order_id, total_amount, status="created")
    items = [{"song_id": s["id"], "price": float(s["price"])} for s in songs]
    create_order_items(inserted["id"], items)

    return {
        "id": inserted["id"],
        "razorpay_order_id": razorpay_order_id,
        "amount": total_amount,
        "currency": "INR",
        "razorpay_key_id": settings.razorpay_key_id,
        "is_mock": False,
    }


@router.post("/orders/verify")
def verify_order_route(
    payload: OrderVerify,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Verify Razorpay signature after customer checkout and activate purchases."""
    user_id = current_user["id"]
    order = get_order_by_razorpay_id(payload.razorpay_order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    is_mock = "order_mock_" in payload.razorpay_order_id or "placeholder" in settings.razorpay_key_id

    if not is_mock:
        try:
            client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
            client.utility.verify_payment_signature({
                "razorpay_order_id": payload.razorpay_order_id,
                "razorpay_payment_id": payload.razorpay_payment_id,
                "razorpay_signature": payload.razorpay_signature,
            })
        except razorpay.errors.SignatureVerificationError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment signature verification failed",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Verification error: {str(e)}",
            )

    # Mark order as paid
    update_order_status(order["id"], "paid", payload.razorpay_payment_id)

    # Add purchased tracks to library
    items = get_order_items(order["id"])
    if items:
        create_purchases(user_id, order["id"], items)

    return {
        "status": "success",
        "message": "Payment verified! Full studio tracks added to your library.",
        "order_id": order["id"],
    }
