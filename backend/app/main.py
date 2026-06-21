from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import songs, genres, orders, webhooks, admin
from app.config import settings

app = FastAPI(
    title="Music City Odia - Backend API",
    description="E-commerce and audio streaming API for Music City Odia Studio",
    version="1.0.0"
)

# Configure CORS
# Allow localhost:5173 (standard Vite React port) and production origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(songs.router)
app.include_router(genres.router)
app.include_router(orders.router)
app.include_router(webhooks.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "brand": "Music City Odia",
        "tagline": "No.1 Quality Audio Sound in Odisha — Super Bass Sound Studio",
        "services": [
            "Music Recording",
            "Voice Dubbing",
            "Mixing",
            "Camera & Film Editing"
        ]
    }
