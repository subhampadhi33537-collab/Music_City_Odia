from flask import Blueprint
from typing import List
import uuid
import razorpay
from app.schemas import OrderCreate, OrderVerify
from app.auth import require_current_user
from app.config import settings
from app.routers.songs import format_song_record
from app.flask_utils import get_json_body, json_response
from app.http import HTTPException, status

orders_bp = Blueprint("orders", __name__)

@orders_bp.route("/orders", methods=["POST"])
@require_current_user
def create_order_route(current_user: dict):
    order_data = OrderCreate.model_validate(get_json_body())
    user_id = current_user["id"]
    song_ids = order_data.song_ids
    
    if not song_ids:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No songs specified in the cart.")
        
    try:
        from app.database import get_songs_by_ids, check_multiple_purchases, create_order, create_order_items
        
        # Fetch prices of all songs
        songs = get_songs_by_ids(song_ids)
        
        if not songs or len(songs) != len(song_ids):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "One or more songs in your cart are invalid.")
            
        total_amount = sum(float(song["price"]) for song in songs)
        
        # Check if user already owns any of these songs
        owned_ids = check_multiple_purchases(user_id, song_ids)
        if owned_ids:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "You already own one or more of these songs in your library.")
        
        # Mock payment routing if credentials are placeholder
        if "placeholder" in settings.razorpay_key_id:
            mock_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
            
            # Save order to DB
            inserted_order = create_order(user_id, mock_order_id, total_amount, status='created')
            
            # Create order items
            items_to_insert = [
                {"song_id": song["id"], "price": float(song["price"])}
                for song in songs
            ]
            create_order_items(inserted_order["id"], items_to_insert)
            
            return json_response({
                "id": inserted_order["id"],
                "razorpay_order_id": mock_order_id,
                "amount": total_amount,
                "currency": "INR",
                "razorpay_key_id": settings.razorpay_key_id,
                "is_mock": True
            })
            
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
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Razorpay Order creation failed: {str(rz_err)}")

        # Save order to DB
        inserted_order = create_order(user_id, razorpay_order_id, total_amount, status='created')
        
        # Create order items
        items_to_insert = [
            {"song_id": song["id"], "price": float(song["price"])}
            for song in songs
        ]
        create_order_items(inserted_order["id"], items_to_insert)
        
        return json_response({
            "id": inserted_order["id"],
            "razorpay_order_id": razorpay_order_id,
            "amount": total_amount,
            "currency": "INR",
            "razorpay_key_id": settings.razorpay_key_id,
            "is_mock": False
        })
        
    except HTTPException:
        raise
    except Exception as e:
        if "placeholder" in settings.supabase_service_role_key:
            return json_response({
                "id": "mock-order-id-1",
                "razorpay_order_id": f"order_mock_{uuid.uuid4().hex[:12]}",
                "amount": 19.00,
                "currency": "INR",
                "razorpay_key_id": settings.razorpay_key_id,
                "is_mock": True
            })
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Order creation failed: {str(e)}")

@orders_bp.route("/orders/verify", methods=["POST"])
@require_current_user
def verify_order(current_user: dict):
    verification = OrderVerify.model_validate(get_json_body())
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
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid payment signature")
        except Exception as e:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Payment verification failed: {str(e)}")
            
    # 2. Update order to paid and write purchases
    try:
        from app.database import get_order_by_razorpay_id, update_order_status, get_order_items, create_purchases
        
        # Get order details
        order = get_order_by_razorpay_id(verification.razorpay_order_id)
        if not order:
            if is_mock:
                return json_response({"status": "success", "message": "Mock verification succeeded."})
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
            
        if order.get("user_id") and order["user_id"] != user_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Order does not belong to this user")
        
        # Avoid double processing
        if order["status"] == "paid":
            return json_response({"status": "success", "message": "Payment already verified"})
            
        # Update order status
        update_order_status(order["id"], "paid", verification.razorpay_payment_id)
        
        # Get order items to insert into purchases
        items = get_order_items(order["id"])
        
        if items:
            create_purchases(user_id, order["id"], items)
            
        return json_response({"status": "success", "message": "Payment verified and purchases unlocked"})
    except HTTPException:
        raise
    except Exception as e:
        if "placeholder" in settings.supabase_service_role_key:
            return json_response({"status": "success", "message": "Mock payment verified and purchases unlocked."})
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Database update failed: {str(e)}")

def _load_user_purchases(user_id: str) -> List[dict]:
    from app.database import get_user_purchases
    purchases = get_user_purchases(user_id)

    for purchase in purchases:
        # Reconstruct song structure for frontend
        if "genre_name" in purchase:
            purchase["song"] = {
                "id": purchase["id"],
                "title": purchase["title"],
                "artist": purchase["artist"],
                "description": purchase["description"],
                "cover_image_url": purchase["cover_image_url"],
                "preview_storage_path": purchase["preview_storage_path"],
                "full_storage_path": purchase["full_storage_path"],
                "price": float(purchase["price"]),
                "duration_seconds": purchase["duration_seconds"],
                "is_featured": purchase["is_featured"],
                "is_published": purchase["is_published"],
                "genres": {"name": purchase["genre_name"]}
            }
            format_song_record(purchase["song"])

    return purchases

@orders_bp.route("/orders/purchases", methods=["GET"])
@require_current_user
def list_my_purchases_legacy(current_user: dict):
    return _get_purchases_for_user(current_user)

@orders_bp.route("/me/purchases", methods=["GET"])
@require_current_user
def list_my_purchases(current_user: dict):
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
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Database error loading purchases: {str(e)}")
