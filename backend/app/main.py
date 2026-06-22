import os

from flask import Flask, request

from app.flask_utils import json_response
from app.http import HTTPException, status
from app.routers.admin import admin_bp
from app.routers.auth import auth_bp
from app.routers.genres import genres_bp
from app.routers.orders import orders_bp
from app.routers.songs import songs_bp
from app.routers.webhooks import webhooks_bp
from app.routers.bookings import bookings_bp

app = Flask(__name__)

ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "https://music-city-odia.vercel.app,http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
}


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin and (origin in ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "false"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Vary"] = "Origin"
    return response


@app.errorhandler(HTTPException)
def handle_http_exception(error):
    return json_response({"detail": error.detail}, status_code=error.status_code)


@app.errorhandler(Exception)
def handle_unexpected_exception(error):
    return json_response({"detail": str(error)}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@app.route("/", methods=["GET"])
def read_root():
    return json_response(
        {
            "status": "healthy",
            "brand": "Music City Odia",
            "tagline": "No.1 Quality Audio Sound in Odisha — Super Bass Sound Studio",
            "services": [
                "Music Recording",
                "Voice Dubbing",
                "Mixing",
                "Camera & Film Editing",
            ],
        }
    )


app.register_blueprint(songs_bp)
app.register_blueprint(genres_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(webhooks_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(bookings_bp)


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8000")),
        debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true",
    )
