from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import uuid
import razorpay
from app.database import supabase_client
from app.schemas import OrderCreate, OrderVerify
from app.auth import get_current_user
from app.config import settings
from app.routers.songs import format_song_record

router = APIRouter(tags=["orders"])

@router.post("/orders", response_model=dict)
def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    song_ids = order_data.song_ids
    
    if not song_ids:
        raise HTTPException(status_code=400, detail="No songs specified in the cart.")
        
    try:
        # Fetch prices of all songs
        songs_resp = supabase_client.table("songs").select("id, price, title").in_("id", song_ids).execute()
        songs = songs_resp.data or []
        
        if not songs or len(songs) != len(song_ids):
            raise HTTPException(status_code=400, detail="One or more songs in your cart are invalid.")
            
        total_amount = sum(float(song["price"]) for song in songs)
        
        # Check if user already owns any of these songs
        owned_resp = supabase_client.table("purchases").select("song_id").eq("user_id", user_id).in_("song_id", song_ids).execute()
        if owned_resp.data and len(owned_resp.data) > 0:
            owned_ids = [p["song_id"] for p in owned_resp.data]
            raise HTTPException(status_code=400, detail="You already own one or more of these songs in your library.")
        
        # Mock payment routing if credentials are placeholder
        if "placeholder" in settings.razorpay_key_id:
            mock_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
            
            # Save order to DB
            order_insert = supabase_client.table("orders").insert({
                "user_id": user_id,
                "razorpay_order_id": mock_order_id,
                "status": "created",
                "total_amount": total_amount
            }).execute()
            
            inserted_order = order_insert.data[0]
            
            # Create order items
            order_items_data = [
                {"order_id": inserted_order["id"], "song_id": song["id"], "price": float(song["price"])}
                for song in songs
            ]
            supabase_client.table("order_items").insert(order_items_data).execute()
            
            return {
                "id": inserted_order["id"],
                "razorpay_order_id": mock_order_id,
                "amount": total_amount,
                "currency": "INR",
                "razorpay_key_id": settings.razorpay_key_id,
                "is_mock": True
            }
            
        # Real Razorpay Order creation
        try:
            client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
            razorpay_order = client.order.create({
                "amount": int(total_amount * 100), # amount in paise
                "currency": "INR",
                "receipt": f"receipt_{uuid.uuid4().hex[:8]}"
            })
            razorpay_order_id = razorpay_order["id"]
        except Exception as rz_err:
            raise HTTPException(status_code=500, detail=f"Razorpay Order creation failed: {str(rz_err)}")

        # Save order to DB
        order_insert = supabase_client.table("orders").insert({
            "user_id": user_id,
            "razorpay_order_id": razorpay_order_id,
            "status": "created",
            "total_amount": total_amount
        }).execute()
        
        inserted_order = order_insert.data[0]
        
        # Create order items
        order_items_data = [
            {"order_id": inserted_order["id"], "song_id": song["id"], "price": float(song["price"])}
            for song in songs
        ]
        supabase_client.table("order_items").insert(order_items_data).execute()
        
        return {
            "id": inserted_order["id"],
            "razorpay_order_id": razorpay_order_id,
            "amount": total_amount,
            "currency": "INR",
            "razorpay_key_id": settings.razorpay_key_id,
            "is_mock": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if "placeholder" in settings.supabase_service_role_key:
            return {
                "id": "mock-order-id-1",
                "razorpay_order_id": f"order_mock_{uuid.uuid4().hex[:12]}",
                "amount": 19.00,
                "currency": "INR",
                "razorpay_key_id": settings.razorpay_key_id,
                "is_mock": True
            }
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")

@router.post("/orders/verify")
def verify_order(verification: OrderVerify, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # 1. Signature verification — mock only allowed with placeholder dev keys
    is_mock = (
        "placeholder" in settings.razorpay_key_id
        and verification.razorpay_signature == "mock_signature_success"
    )
    
    if not is_mock:
        try:
            client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
            client.utility.verify_payment_signature({
                'razorpay_order_id': verification.razorpay_order_id,
                'razorpay_payment_id': verification.razorpay_payment_id,
                'razorpay_signature': verification.razorpay_signature
            })
        except razorpay.errors.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")
            
    # 2. Update order to paid and write purchases
    try:
        # Get order details
        order_resp = supabase_client.table("orders").select("*").eq("razorpay_order_id", verification.razorpay_order_id).execute()
        if not order_resp.data or len(order_resp.data) == 0:
            if is_mock:
                # If local database doesn't have order (e.g. initial setup placeholder), return success directly
                return {"status": "success", "message": "Mock verification succeeded."}
            raise HTTPException(status_code=404, detail="Order not found")
            
        order = order_resp.data[0]

        if order.get("user_id") and order["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Order does not belong to this user")
        
        # Avoid double processing
        if order["status"] == "paid":
            return {"status": "success", "message": "Payment already verified"}
            
        # Update order status
        supabase_client.table("orders").update({
            "status": "paid",
            "razorpay_payment_id": verification.razorpay_payment_id
        }).eq("id", order["id"]).execute()
        
        # Get order items to insert into purchases
        items_resp = supabase_client.table("order_items").select("song_id, price").eq("order_id", order["id"]).execute()
        items = items_resp.data or []
        
        purchases_data = [
            {"user_id": user_id, "song_id": item["song_id"], "order_id": order["id"]}
            for item in items
        ]
        
        if purchases_data:
            supabase_client.table("purchases").upsert(purchases_data, on_conflict="user_id,song_id").execute()
            
        return {"status": "success", "message": "Payment verified and purchases unlocked"}
    except HTTPException:
        raise
    except Exception as e:
        if "placeholder" in settings.supabase_service_role_key:
            return {"status": "success", "message": "Mock payment verified and purchases unlocked."}
        raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}")

def _load_user_purchases(user_id: str) -> List[dict]:
    response = supabase_client.table("purchases").select("*, song:songs(*, genres(name))").eq("user_id", user_id).execute()
    purchases = response.data or []

    for purchase in purchases:
        song = purchase.get("song")
        if song:
            purchase["song"] = format_song_record(song)

    return purchases

@router.get("/orders/purchases")
def list_my_purchases_legacy(current_user: dict = Depends(get_current_user)):
    return _get_purchases_for_user(current_user)

@router.get("/me/purchases")
def list_my_purchases(current_user: dict = Depends(get_current_user)):
    return _get_purchases_for_user(current_user)

def _get_purchases_for_user(current_user: dict) -> List[dict]:
    user_id = current_user["id"]
    try:
        return _load_user_purchases(user_id)
    except Exception as e:
        if "placeholder" in settings.supabase_service_role_key:
            return [
                {
                    "id": "mock-purchase-1",
                    "user_id": user_id,
                    "song_id": "mock-song-1",
                    "purchased_at": "2026-06-21T10:00:00Z",
                    "song": {
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
                        "genres": {"name": "Odia Pop"}
                    }
                }
            ]
        raise HTTPException(status_code=500, detail=f"Database error loading purchases: {str(e)}")
