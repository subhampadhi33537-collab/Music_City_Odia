import os
import sys

# Add the backend directory to sys.path so it can find the 'app' package
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.main import app


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8000")),
        debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true",
    )