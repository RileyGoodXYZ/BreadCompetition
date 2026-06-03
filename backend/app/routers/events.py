"""Events router — competitions and their attendance roster.

An "event" is one competition (regional, district, championship, off-season).
The `event_key` follows TBA's convention (`2026casj` = 2026 Silicon Valley
Regional) so we can sync from upstream without an id translation layer.

Three concerns live here:

  1. Event metadata CRUD (name, location, dates, status string).
     Read by the Home shell to render the "current event" banner.
  2. Event attendance — which teams are at this event. This is the read
     that AddRobotDialog and the RobotData search actually want.
     Backed by the `event_teams` join table.
  3. Match schedule (stub) — `GET /api/events/{key}/matches`, returning [].
     Spelled out in detail so the next person picks it up cleanly.
"""
import json
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, Response, status

from ..db import get_conn
from ..models import EventTeamRegister, EventUpsert

router = APIRouter(prefix="/api/events", tags=["events"])


def _event_row_to_dict(row) -> dict[str, Any]:
    d = dict(row)
    d["data"] = json.loads(d["data"]) if d.get("data") else {}
    return d


def _team_row_to_dict(row) -> dict[str, Any]:
    d = dict(row)
    d["data"] = json.loads(d["data"]) if d.get("data") else {}
    return d


# ---------------------------------------------------------------------------
# Event metadata
# ---------------------------------------------------------------------------

@router.get("")
def list_events(
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[dict[str, Any]]:
    """List all known events.

    TODO(impl):
      - Add `?upcoming=true` / `?active=true` filters once `data` has
        structured `start_date` / `end_date` fields. Today we just dump
        everything and the client filters.
    """
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM events ORDER BY event_key DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
    return [_event_row_to_dict(r) for r in rows]


@router.get("/{event_key}")
def get_event(event_key: str) -> dict[str, Any]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM events WHERE event_key = ?", (event_key,)
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="event not found")
    return _event_row_to_dict(row)


@router.put("/{event_key}", status_code=status.HTTP_200_OK)
def upsert_event(event_key: str, payload: EventUpsert) -> dict[str, Any]:
    """Insert or update an event. Idempotent.

    TODO(impl):
      - Lock down once auth lands.
      - When TBA sync exists, prefer pulling from TBA over hand-PUTs to
        avoid drift on dates / status.
    """
    if payload.event_key != event_key:
        payload = payload.model_copy(update={"event_key": event_key})

    serialized = json.dumps(payload.data, sort_keys=True, separators=(",", ":"))

    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO events (event_key, name, data, updated_at)
            VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT(event_key) DO UPDATE SET
              name       = excluded.name,
              data       = excluded.data,
              updated_at = datetime('now')
            """,
            (event_key, payload.name, serialized),
        )
        row = conn.execute(
            "SELECT * FROM events WHERE event_key = ?", (event_key,)
        ).fetchone()
    return _event_row_to_dict(row)


@router.delete("/{event_key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_key: str) -> Response:
    """Hard delete an event. Cascades to event_teams rows.

    TODO(impl):
      - Probably should refuse deletion if there are submissions or
        picklists keyed to this event_key. Today we just delete and
        leave orphans — fine for dev.
    """
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM events WHERE event_key = ?", (event_key,))
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="event not found"
            )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Event attendance (teams at this event)
#
# STUDENT EXERCISE — these three endpoints are intentionally stubbed.
# The route signatures and docstrings spell out exactly what to build;
# the bodies raise 501 until implemented. Use `teams.py` and the event
# metadata endpoints above as reference patterns.
# ---------------------------------------------------------------------------

@router.get("/{event_key}/teams")
def list_event_teams(
    event_key: str,
    q: Optional[str] = Query(default=None, description="Substring match on team_number or name"),
) -> list[dict[str, Any]]:
    """Teams attending this event.

    This is what AddRobotDialog and the RobotData typeahead consume on
    the frontend. Return the *full team object* (name, drivetrain,
    image, etc.) joined from `teams`, not just the team numbers —
    saves the UI from doing N+1 lookups to render the picker.

    TODO(student): implement.

    Approach:
      1. Build a SQL query that joins `event_teams` to `teams` on
         `team_number`, filtered by `et.event_key = ?`. Example:

           SELECT t.*
           FROM event_teams et
           JOIN teams t ON t.team_number = et.team_number
           WHERE et.event_key = ?
           ORDER BY t.team_number ASC

      2. If `q` is provided, also filter:
         `AND (CAST(t.team_number AS TEXT) LIKE ? OR LOWER(t.name) LIKE ?)`
         with `?` bound to `%<q.lower()>%`.
      3. Use `with get_conn() as conn:` to execute (see `teams.py::list_teams`).
      4. Return `[_team_row_to_dict(r) for r in rows]`.

    Edge cases worth thinking about:
      - INNER JOIN silently drops event_teams rows whose `team_number`
        isn't in the `teams` catalog. Decide: is that desirable, or
        should you LEFT JOIN and synthesize a `{name: "Team N"}` row?
      - Don't bother paginating; Champs has ~600 teams per division at
        most.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )


@router.post("/{event_key}/teams", status_code=status.HTTP_201_CREATED)
def register_event_teams(event_key: str, payload: EventTeamRegister) -> dict[str, Any]:
    """Register one or more teams as attending this event.

    Bulk by design — a TBA sync or seed script wants to push the full
    attendance list (40-80 teams) in one round-trip.

    TODO(student): implement.

    Approach:
      1. First, verify the event exists. Query `SELECT 1 FROM events
         WHERE event_key = ?`; raise 404 if no row. Doing this upfront
         is cleaner than letting the FK violation surface as a 500.
      2. Bulk-insert with `conn.executemany(...)` using
         `INSERT OR IGNORE INTO event_teams (event_key, team_number)
         VALUES (?, ?)` — IGNORE makes the call idempotent (re-registering
         an already-attending team is a no-op, not an error).
      3. Return a small dict the client can use to verify, e.g.:
           {
             "event_key": event_key,
             "registered": payload.team_numbers,
             "attendance_count": <SELECT COUNT(*) FROM event_teams WHERE event_key = ?>
           }

    Edge cases:
      - Teams must already exist in the global `teams` catalog (FK
        constraint). Decide whether to upsert stub teams here or
        require the seed script to push teams before events. Latter
        is cleaner.
      - If `payload.team_numbers` is empty, the Pydantic model
        (`Field(min_length=1)`) already rejects it with 422.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )


@router.delete(
    "/{event_key}/teams/{team_number}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def unregister_event_team(event_key: str, team_number: int) -> Response:
    """Remove one team from an event's attendance roster.

    Doesn't touch the global `teams` row — just the join.

    TODO(student): implement.

    Approach:
      1. `DELETE FROM event_teams WHERE event_key = ? AND team_number = ?`
      2. Check `cursor.rowcount`. If 0, raise 404 — nothing was attending.
      3. On success, return `Response(status_code=status.HTTP_204_NO_CONTENT)`.

    Reference: `delete_event` directly above does the same dance for
    the parent events table.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )


# ---------------------------------------------------------------------------
# Match schedule (stub)
# ---------------------------------------------------------------------------

@router.get("/{event_key}/matches")
def list_event_matches(event_key: str) -> list[dict[str, Any]]:
    """Match schedule for an event.

    NOT IMPLEMENTED — stub. Returns an empty list so the UI can wire to
    it without 404ing.

    TODO(impl):
      - This is the read that powers `lib/schedule.js::UPCOMING_MATCHES`.
        Shape expected by the UI:
          {id, number, type, scheduledAt, startsInLabel, field, red[3], blue[3]}
      - Two reasonable approaches:
          a) Add a `matches` table and a sync job that pulls from TBA
             (`/event/{key}/matches/simple`) on a schedule. Pros: works
             offline, single source of truth, can attach our own metadata
             (notes, photos). Cons: cache invalidation + a sync job.
          b) Proxy TBA on each request with a short in-process cache
             (60s). Pros: no schema, always fresh. Cons: needs TBA API
             key in env, brittle without internet, can't extend.
        Pick (a) when we need offline support, (b) until then.
      - Match-strategy Library currently sorts by `updated_at`. Once
        this exists, the Library should sort upcoming strategies by
        match `scheduledAt` to read like a real schedule.
    """
    return []
