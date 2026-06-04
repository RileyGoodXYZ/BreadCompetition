"""Events router — competitions and their attendance roster — STUDENT EXERCISE.

An "event" is one competition (regional, district, championship, off-season).
The `event_key` follows TBA's convention (`2026casj` = 2026 Silicon Valley
Regional) so we can sync from upstream without an id translation layer.

The CRUD here is intentionally stubbed. Every endpoint keeps its route
decorator, signature, and a detailed TODO docstring — the implementation is
yours. Use `teams.py` (full roster CRUD, same upsert/delete dance) and
`submissions.py` (filtered list reads) as reference patterns; the helpers and
conventions there port directly here.

Three concerns live here:

  1. Event metadata CRUD (name, plus dates / status in `data`). Read by the
     Home shell to render the "current event" banner. STUDENT EXERCISE.
  2. Event attendance — which teams are at this event, via the `event_teams`
     join table. This is the read AddRobotDialog and the RobotData search
     actually want. STUDENT EXERCISE.
  3. Match schedule — `GET /api/events/{key}/matches`. A *planning* stub
     (returns []), NOT a student exercise: the design (TBA proxy vs. a
     `matches` table) isn't chosen yet. Its docstring lays out the options.
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
#
# STUDENT EXERCISE — these four endpoints are intentionally stubbed. The route
# signatures and docstrings spell out exactly what to build; the bodies raise
# 501 until implemented. `teams.py` does the same list / get / upsert / delete
# dance over the global roster — it's the closest reference.
# ---------------------------------------------------------------------------

@router.get("")
def list_events(
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[dict[str, Any]]:
    """List all known events, newest key first.

    TODO(student): implement.

    Approach:
      1. `with get_conn() as conn:` and execute
         `SELECT * FROM events ORDER BY event_key DESC LIMIT ? OFFSET ?`
         with `(limit, offset)`.
      2. Return `[_event_row_to_dict(r) for r in rows]`.

    Reference: `teams.py::list_teams` is the same paginated dump.

    Later: add `?upcoming=true` / `?active=true` filters once `data` carries
    structured `start_date` / `end_date` fields. Today the client filters.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )


@router.get("/{event_key}")
def get_event(event_key: str) -> dict[str, Any]:
    """Fetch one event by key.

    TODO(student): implement.

    Approach (one-line query, two-line handler):
      1. `row = conn.execute("SELECT * FROM events WHERE event_key = ?", (event_key,)).fetchone()`
      2. If `row is None`, raise:
         `HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="event not found")`
      3. Otherwise return `_event_row_to_dict(row)`.

    Reference: `teams.py::get_team`.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )


@router.put("/{event_key}", status_code=status.HTTP_200_OK)
def upsert_event(event_key: str, payload: EventUpsert) -> dict[str, Any]:
    """Insert or update an event. Idempotent.

    PUT (not POST) because this is reserved for admin / seed / TBA-sync
    callers that know the `event_key` up front and may re-push the same row.

    TODO(student): implement.

    Approach (mirrors `teams.py::upsert_team`):
      1. Force `event_key` from the URL onto the payload so the body can't
         disagree with the path:
         `if payload.event_key != event_key:
              payload = payload.model_copy(update={"event_key": event_key})`
      2. Serialize `data`:
         `serialized = json.dumps(payload.data, sort_keys=True, separators=(",", ":"))`
      3. Run an upsert:
           INSERT INTO events (event_key, name, data, updated_at)
           VALUES (?, ?, ?, datetime('now'))
           ON CONFLICT(event_key) DO UPDATE SET
             name = excluded.name, data = excluded.data,
             updated_at = datetime('now')
      4. SELECT * back and return `_event_row_to_dict(row)`.

    Later:
      - Lock this down once auth lands — it's a privileged write.
      - When TBA sync exists, prefer pulling from TBA over hand-PUTs so dates
        / status don't drift.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )


@router.delete("/{event_key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_key: str) -> Response:
    """Hard delete an event. Cascades to its `event_teams` rows (the FK is
    declared `ON DELETE CASCADE` in schema.sql).

    TODO(student): implement.

    Approach:
      1. `cursor = conn.execute("DELETE FROM events WHERE event_key = ?", (event_key,))`
      2. If `cursor.rowcount == 0`, raise 404.
      3. Return `Response(status_code=status.HTTP_204_NO_CONTENT)`.

    Worth deciding: probably refuse deletion (409) if submissions or picklists
    still reference this `event_key`. There's no FK from those, so today a
    delete just leaves them orphaned — fine for dev, sketchy for real data.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )


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
