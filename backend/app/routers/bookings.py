from flask import Blueprint, request
from app.database import get_db_connection, release_db_connection
from app.flask_utils import get_json_body, json_response
from app.http import HTTPException, status
from app.auth import get_current_user

bookings_bp = Blueprint("bookings", __name__)

@bookings_bp.route("/bookings", methods=["POST"])
def create_booking():
    data = get_json_body()
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    service = data.get("service")
    message = data.get("message")
    
    if not name or not phone or not service or not message:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing required booking details")
        
    # Attempt to get current user if logged in (optional)
    user_id = None
    try:
        current_user = get_current_user()
        user_id = current_user.get("id")
    except:
        pass
        
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO bookings (user_id, name, email, phone, service, message)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (user_id, name, email, phone, service, message))
        
        booking_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        
        return json_response({
            "status": "success",
            "message": "Booking request submitted successfully",
            "booking_id": booking_id
        }, status_code=status.HTTP_201_CREATED)
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Failed to submit booking: {str(e)}")
    finally:
        release_db_connection(conn)
