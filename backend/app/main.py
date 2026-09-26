import logging
import os
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.bookings import router as bookings_router
from app.routers.genres import router as genres_router
from app.routers.orders import router as orders_router
from app.routers.songs import router as songs_router
from app.routers.webhooks import router as webhooks_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("music_city_odia")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables, seeds, and storage directories
    logger.info("Initializing Music City Odia backend...")
    init_db()
    
    # Ensure static directories exist
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
    os.makedirs(os.path.join(static_dir, "covers"), exist_ok=True)
    os.makedirs(os.path.join(static_dir, "audio"), exist_ok=True)
    
    logger.info("Database and static storage verified.")
    yield
    logger.info("Shutting down Music City Odia API server.")


app = FastAPI(
    title="Music City Odia API",
    description="No.1 Quality Audio Sound in Odisha — Studio E-Commerce & Google Drive Audio Storage API",
    version="2.0.0",
    lifespan=lifespan,
)

# Configure CORS
allowed_origins: List[str] = [
    origin.strip()
    for origin in settings.cors_allowed_origins.split(",")
    if origin.strip()
]
if "*" not in allowed_origins:
    allowed_origins.extend([
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://music-city-odia.vercel.app",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.exception_handler(RuntimeError)
async def runtime_error_handler(request: Request, exc: RuntimeError):
    msg = str(exc)
    if "PostgreSQL" in msg:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "database_unavailable",
                "detail": msg,
                "hint": "Please verify that your PostgreSQL database (Supabase) is unpaused and active at https://supabase.com/dashboard/project/gmkbhexmclalztmexuzk",
            },
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": msg},
    )


# Mount static files directory for local assets
static_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
os.makedirs(static_path, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_path), name="static")

# Include Routers
app.include_router(songs_router, tags=["Songs"])
app.include_router(genres_router, tags=["Genres"])
app.include_router(orders_router, tags=["Orders"])
app.include_router(auth_router, tags=["Auth"])
app.include_router(admin_router, tags=["Admin"])
app.include_router(bookings_router, tags=["Bookings"])
app.include_router(webhooks_router, tags=["Webhooks"])


@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "framework": "FastAPI",
        "brand": "Music City Odia",
        "tagline": "No.1 Quality Audio Sound in Odisha — Super Bass Sound Studio",
        "google_drive_folder_id": settings.google_drive_folder_id,
        "google_drive_folder_url": f"https://drive.google.com/drive/folders/{settings.google_drive_folder_id}",
        "services": [
            "Music Recording",
            "Voice Dubbing",
            "Mixing & Mastering",
            "Camera & Film Editing",
            "Google Drive High-Speed Audio Distribution",
        ],
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
