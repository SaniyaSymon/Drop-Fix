import os
import logging
from pathlib import Path

import requests
from dotenv import load_dotenv

logger = logging.getLogger("DROPFIX_STORAGE")

load_dotenv(Path(__file__).parent.parent / '.env')

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "dropfix"

_storage_key = None


def _emergent_key() -> str:
    return os.environ.get("EMERGENT_LLM_KEY", "")


def init_storage(force: bool = False) -> str:
    """Call once at startup. Idempotent — returns a reusable storage key."""
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": _emergent_key()}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload bytes to object storage. Returns {'path','size','etag'}."""
    try:
        key = init_storage()
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data,
            timeout=120,
        )
        if resp.status_code == 503:
            # Stale key — reset & retry once
            key = init_storage(force=True)
            resp = requests.put(
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": key, "Content-Type": content_type},
                data=data,
                timeout=120,
            )
        resp.raise_for_status()
        return resp.json()
    except requests.HTTPError as e:
        status = e.response.status_code if e.response is not None else None
        logger.error(f"put_object failed ({status}) for {path}: {e}")
        raise


def get_object(path: str):
    """Download object. Returns (content_bytes, content_type)."""
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    if resp.status_code == 503:
        key = init_storage(force=True)
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60,
        )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
