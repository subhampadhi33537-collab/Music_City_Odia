import os
import sys

# Ensure current directory is in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

# Expose app for ASGI servers like uvicorn / gunicorn
# Run with: uvicorn asgi:app --host 0.0.0.0 --port 8000 --reload
# Or directly: python asgi.py

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    print("=" * 60)
    print("  Music City Odia - FastAPI Backend Server")
    print(f"  Listening on http://0.0.0.0:{port}")
    print("  API Docs available at: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run("asgi:app", host="0.0.0.0", port=port, reload=True)
