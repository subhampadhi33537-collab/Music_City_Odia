from fastapi import APIRouter, Request, HTTPException, Header, status
import razorpay
import json
from app.database import supabase_client
from app.config import settings

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None, alias="X-Razorpay-Signature")
):
    if not x_razorpay_signature:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing signature header")
        
    # Get raw body
    body = await request.body()
    body_str = body.decode("utf-8")
    
    # 1. Signature check
    try:
        client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
        client.utility.verify_webhook_signature(
            body_str,
            x_razorpay_signature,
            settings.razorpay_webhook_secret
        )
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Webhook validation error: {str(e)}")
        
    # 2. Parse payload and process payment
    try:
        event_data = json.loads(body_str)
        event = event_data.get("event")
        
        # We only care about order.paid or payment.captured events
        if event in ["order.paid", "payment.captured"]:
            entity = event_data.get("payload", {}).get("payment", {}).get("entity", {})
            razorpay_order_id = entity.get("order_id")
            razorpay_payment_id = entity.get("id")
            
            if not razorpay_order_id:
                return {"status": "skipped", "message": "No order_id found in event payload"}
                
            # Query the order from database
            order_resp = supabase_client.table("orders").select("*").eq("razorpay_order_id", razorpay_order_id).execute()
            
            if order_resp.data and len(order_resp.data) > 0:
                order = order_resp.data[0]
                
                # Check if already processed
                if order["status"] == "paid":
                    return {"status": "success", "message": "Already paid"}
                
                # Update status
                supabase_client.table("orders").update({
                    "status": "paid",
                    "razorpay_payment_id": razorpay_payment_id
                }).eq("id", order["id"]).execute()
                
                # Get order items to unlock purchases
                items_resp = supabase_client.table("order_items").select("song_id, price").eq("order_id", order["id"]).execute()
                items = items_resp.data or []
                
                purchases_data = [
                    {"user_id": order["user_id"], "song_id": item["song_id"], "order_id": order["id"]}
                    for item in items
                ]
                
                if purchases_data:
                    supabase_client.table("purchases").upsert(purchases_data, on_conflict="user_id,song_id").execute()
                
                return {"status": "success", "message": "Payment verified via webhook"}
                
        return {"status": "ignored", "message": f"Event {event} ignored"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process webhook event: {str(e)}")
