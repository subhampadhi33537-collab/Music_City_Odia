import json

import razorpay
from flask import Blueprint, request

from app.config import settings
from app.flask_utils import json_response
from app.http import HTTPException, status

webhooks_bp = Blueprint("webhooks", __name__)


@webhooks_bp.route("/webhooks/razorpay", methods=["POST"])
def razorpay_webhook():
    x_razorpay_signature = request.headers.get("X-Razorpay-Signature")
    if not x_razorpay_signature:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing signature header")

    body_str = request.get_data(as_text=True)

    try:
        client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
        client.utility.verify_webhook_signature(
            body_str,
            x_razorpay_signature,
            settings.razorpay_webhook_secret,
        )
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid webhook signature")
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Webhook validation error: {str(e)}")

    try:
        event_data = json.loads(body_str)
        event = event_data.get("event")

        if event in ["order.paid", "payment.captured"]:
            entity = event_data.get("payload", {}).get("payment", {}).get("entity", {})
            razorpay_order_id = entity.get("order_id")
            razorpay_payment_id = entity.get("id")

            if not razorpay_order_id:
                return json_response({"status": "skipped", "message": "No order_id found in event payload"})

            from app.database import get_order_by_razorpay_id, update_order_status, get_order_items, create_purchases
            
            order = get_order_by_razorpay_id(razorpay_order_id)

            if order:
                if order["status"] == "paid":
                    return json_response({"status": "success", "message": "Already paid"})

                update_order_status(order["id"], "paid", razorpay_payment_id)

                items = get_order_items(order["id"])

                if items:
                    create_purchases(order["user_id"], order["id"], items)

                return json_response({"status": "success", "message": "Payment verified via webhook"})

        return json_response({"status": "ignored", "message": f"Event {event} ignored"})
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Failed to process webhook event: {str(e)}")
