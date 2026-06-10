"""The Blue Alliance integration — manual sync endpoints.

No webhook, no background poller: the scouting server runs on a laptop in the
stands with no inbound internet, so a push would never arrive. You pull when
you have a connection (ahead of the event, or on a hotspot between matches).

  POST /api/tba/sync/{event_key}    event + teams + attendance + match schedule
  GET  /api/tba/status              what's configured (no secrets)

Heavy lifting lives in `services/tba.py`.
"""
import logging
from typing import Any

from fastapi import APIRouter, HTTPException, status

from ..config import settings
from ..services import tba

router = APIRouter(prefix="/api/tba", tags=["tba"])
log = logging.getLogger("tba")


@router.post("/sync/{event_key}")
def sync_event(event_key: str) -> dict[str, Any]:
    """Pull an event's metadata, roster, attendance, and match schedule from
    TBA into local SQLite. Idempotent — safe to re-run. Run it ahead of time
    (or on a hotspot); the data is then served offline during matches."""
    if not settings.TBA_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TBA_API_KEY is not configured",
        )
    try:
        return tba.sync_event(event_key)
    except tba.TBANotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except tba.TBAError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@router.get("/status")
def tba_status() -> dict[str, Any]:
    """Surface what's wired up, without leaking the key."""
    return {
        "api_key_configured": bool(settings.TBA_API_KEY),
        "base_url": settings.TBA_BASE_URL,
    }
