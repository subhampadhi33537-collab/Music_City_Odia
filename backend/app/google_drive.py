import io
import json
import logging
import os
import re
from typing import Optional, Dict, Any

from app.config import settings

logger = logging.getLogger(__name__)

# Scopes required for uploading, organizing, and setting permissions in Google Drive
SCOPES = ["https://www.googleapis.com/auth/drive"]

DRIVE_ID_REGEX = re.compile(r"[-_\w]{25,}")


def parse_drive_id(url_or_id: Optional[str]) -> Optional[str]:
    """Extract a Google Drive file ID from a URL or raw ID."""
    if not url_or_id:
        return None
    url_or_id = url_or_id.strip()
    if "/" not in url_or_id and "?" not in url_or_id and len(url_or_id) >= 20:
        return url_or_id
    
    # Matches /file/d/{id} or /d/{id}
    match = re.search(r"/(?:file/)?d/([a-zA-Z0-9_-]{20,})", url_or_id)
    if match:
        return match.group(1)
        
    # Matches ?id={id} or &id={id}
    match = re.search(r"[?&]id=([a-zA-Z0-9_-]{20,})", url_or_id)
    if match:
        return match.group(1)
        
    match = DRIVE_ID_REGEX.search(url_or_id)
    return match.group(0) if match else None


def get_drive_links(file_id: str) -> Dict[str, str]:
    """Generate canonical streaming, viewing, and download URLs for a Google Drive file."""
    return {
        "drive_file_id": file_id,
        "drive_web_link": f"https://drive.google.com/file/d/{file_id}/view?usp=sharing",
        "drive_download_link": f"https://drive.google.com/uc?export=download&id={file_id}",
        "drive_stream_url": f"https://docs.google.com/uc?export=open&id={file_id}",
        "drive_thumbnail_url": f"https://drive.google.com/thumbnail?id={file_id}&sz=w800",
    }


def get_drive_service():
    """Initialize the Google Drive API client using service account credentials."""
    try:
        from googleapiclient.discovery import build
        from google.oauth2 import service_account

        # 1. Try JSON string from environment variable
        if settings.google_drive_service_account_json:
            try:
                info = json.loads(settings.google_drive_service_account_json)
                creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
                return build("drive", "v3", credentials=creds, cache_discovery=False)
            except Exception as e:
                logger.warning(f"Failed to load service account from JSON env: {e}")

        # 2. Try file path from config or root
        possible_paths = [
            settings.google_drive_service_account_file,
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "service_account.json"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "credentials.json"),
            os.path.join(os.getcwd(), "service_account.json"),
            os.path.join(os.getcwd(), "credentials.json"),
        ]

        for path in possible_paths:
            if path and os.path.exists(path):
                try:
                    creds = service_account.Credentials.from_service_account_file(path, scopes=SCOPES)
                    return build("drive", "v3", credentials=creds, cache_discovery=False)
                except Exception as e:
                    logger.warning(f"Error loading credentials from {path}: {e}")

        return None
    except ImportError:
        logger.warning("google-api-python-client or google-auth not installed")
        return None
    except Exception as e:
        logger.error(f"Failed to initialize Google Drive service: {e}")
        return None


def upload_audio_to_drive(
    file_bytes: bytes,
    filename: str,
    mime_type: str = "audio/mpeg",
    folder_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Upload an audio file directly to the configured Google Drive folder via Google Drive API.
    Sets public permissions so songs can be streamed and downloaded directly.
    """
    target_folder_id = folder_id or settings.google_drive_folder_id
    service = get_drive_service()

    if service:
        try:
            from googleapiclient.http import MediaIoBaseUpload

            file_metadata = {
                "name": filename,
                "parents": [target_folder_id] if target_folder_id else [],
                "description": "Music City Odia - Studio Audio Track",
            }

            media = MediaIoBaseUpload(
                io.BytesIO(file_bytes),
                mimetype=mime_type or "audio/mpeg",
                resumable=True
            )

            file_obj = service.files().create(
                body=file_metadata,
                media_body=media,
                fields="id, name, webViewLink, webContentLink, size"
            ).execute()

            file_id = file_obj.get("id")

            # Set file permission to readable by anyone with the link
            try:
                service.permissions().create(
                    fileId=file_id,
                    body={"role": "reader", "type": "anyone"},
                    fields="id"
                ).execute()
            except Exception as perm_err:
                logger.warning(f"Could not set public permission on Drive file {file_id}: {perm_err}")

            links = get_drive_links(file_id)
            return {
                "success": True,
                "file_id": file_id,
                "name": file_obj.get("name", filename),
                "web_view_link": file_obj.get("webViewLink") or links["drive_web_link"],
                "web_content_link": file_obj.get("webContentLink") or links["drive_download_link"],
                "stream_url": links["drive_stream_url"],
                "download_url": links["drive_download_link"],
                "folder_id": target_folder_id,
                "source": "google_drive_api",
            }
        except Exception as e:
            logger.error(f"Google Drive API upload failed: {e}")
            # Fall back to local storage while keeping Drive reference format

    # Seamless Fallback when service account is not yet configured:
    # Save to static media folder so app remains 100% operational locally
    import uuid
    safe_name = f"{uuid.uuid4().hex[:12]}_{filename}"
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "audio")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, safe_name)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    pseudo_drive_id = f"local_drive_{uuid.uuid4().hex[:16]}"
    local_url = f"/static/audio/{safe_name}"

    return {
        "success": True,
        "file_id": pseudo_drive_id,
        "name": filename,
        "web_view_link": f"https://drive.google.com/drive/folders/{target_folder_id}",
        "web_content_link": local_url,
        "stream_url": local_url,
        "download_url": local_url,
        "folder_id": target_folder_id,
        "source": "local_fallback",
        "note": "Audio saved locally. To sync directly to Google Drive cloud, provide service_account.json in backend/.",
    }


def check_drive_status() -> Dict[str, Any]:
    """Check connectivity and credentials status for Google Drive."""
    service = get_drive_service()
    folder_id = settings.google_drive_folder_id
    folder_url = f"https://drive.google.com/drive/folders/{folder_id}" if folder_id else ""

    status_info = {
        "configured": service is not None,
        "folder_id": folder_id,
        "folder_url": folder_url,
        "auth_method": "service_account" if service else "none",
        "storage_mode": "Google Drive API v3" if service else "Local Storage with Drive Links fallback",
    }

    if service and folder_id:
        try:
            folder = service.files().get(fileId=folder_id, fields="id, name, mimeType").execute()
            status_info["folder_name"] = folder.get("name")
            status_info["folder_accessible"] = True
        except Exception as e:
            status_info["folder_accessible"] = False
            status_info["folder_error"] = str(e)

    return status_info
