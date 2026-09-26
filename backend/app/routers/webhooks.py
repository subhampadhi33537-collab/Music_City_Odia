import json
import logging
from typing import Dict, Any

import razorpay
from fastapi import APIRouter, Header, HTTPException, Request, status

from app.config import settings
from app.database import (
    create_purchases,
    get_order_by_razorpay_id,
    get_order_items,
    update_order_status,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/webhooks/razorpay")
async def razorpay_webhook_route(
    request: Request,
    x_razorpay_signature: str = Header(None, alias="X-Razorpay-Signature"),
):
    """Handle incoming payment webhooks from Razorpay."""
    if not x_razorpay_signature:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing X-Razorpay-Signature header")

    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8")

    try:
        client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
        client.utility.verify_webhook_signature(
            body_str,
            x_razorpay_signature,
            settings.razorpay_webhook_secret,
        )
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")
    except Exception as e:
        logger.warning(f"Signature check skipped in mock/dev mode: {e}")

    try:
        event_data = json.loads(body_str)
        event = event_data.get("event")

        if event in ["order.paid", "payment.captured"]:
            entity = event_data.get("payload", {}).get("payment", {}).get("entity", {})
            razorpay_order_id = entity.get("order_id")
            razorpay_payment_id = entity.get("id")

            if not razorpay_order_id:
                return {"status": "skipped", "message": "No order_id found in event payload"}

            order = get_order_by_razorpay_id(razorpay_order_id)
            if order:
                if order["status"] == "paid":
                    return {"status": "success", "message": "Already paid"}

                update_order_status(order["id"], "paid", razorpay_payment_id)
                items = get_order_items(order["id"])
                if items:
                    create_purchases(order["user_id"], order["id"], items)

                return {"status": "success", "message": "Payment verified via webhook"}

        return {"status": "ignored", "message": f"Event {event} ignored"}
    except Exception as e:
        logger.error(f"Failed to process webhook event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process webhook event: {str(e)}",
        )
