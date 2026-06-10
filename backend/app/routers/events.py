"""Events router — competitions and their attendance roster.

An "event" is one competition (regional, district, championship, off-season).
The `event_key` follows TBA's convention (`2026casj` = 2026 Silicon Valley
Regional) so we can sync from upstream without an id translation layer.

Three concerns live here:
  1. Event metadata CRUD (name, plus dates / status in `data`). Read by the
     Home shell to render the "current event" banner.
  2. Event attendance — which teams are at this event, via the `event_teams`
     join table. This is the read AddRobotDialog and the RobotData search
     actually want.
  3. Match schedule — `GET /api/events/{key}/matches`. A *planning* stub
     (returns []): the design (TBA proxy vs. a `matches` table) isn't chosen
     yet. Its docstring lays out the options.
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
# list / get / upsert / delete over the `events` table.
# ---------------------------------------------------------------------------

@router.get("")
def list_events(
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[dict[str, Any]]:
    """List all known events, newest key first.

    Later: add `?upcoming=true` / `?active=true` filters once `data` carries
    structured `start_date` / `end_date` fields. Today the client filters.
    """
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM events ORDER BY event_key DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
    return [_event_row_to_dict(r) for r in rows]


@router.get("/{event_key}")
def get_event(event_key: str) -> dict[str, Any]:
    """Fetch one event by key.
    """
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

    PUT (not POST) because this is reserved for admin / seed / TBA-sync
    callers that know the `event_key` up front and may re-push the same row.

    Later:
      - Lock this down once auth lands — it's a privileged write.
      - When TBA sync exists, prefer pulling from TBA over hand-PUTs so dates
        / status don't drift.
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
    """Hard delete an event. Cascades to its `event_teams` rows (the FK is
    declared `ON DELETE CASCADE` in schema.sql).
    """
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM events WHERE event_key = ?", (event_key,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="event not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Event attendance (teams at this event)
#
# list / register / unregister over the `event_teams` join table. Mirrors
# `teams.py` and the event metadata endpoints above.
# ---------------------------------------------------------------------------

@router.get("/{event_key}/teams")
def list_event_teams(
    event_key: str,
    q: Optional[str] = Query(default=None, description="Substring match on team_number or name"),
) -> list[dict[str, Any]]:
    """Teams attending this event.

    Return the *full team object* (name, drivetrain, image, etc.) joined from `teams`.

    Edge cases worth thinking about:
      - INNER JOIN silently drops event_teams rows whose `team_number`
        isn't in the `teams` catalog. Decide: is that desirable, or
        should you LEFT JOIN and synthesize a `{name: "Team N"}` row?
    """
    clauses = ["et.event_key = ?"]
    params: list[Any] = [event_key]
    if q:
        clauses.append("(CAST(t.team_number AS TEXT) LIKE ? OR LOWER(t.name) LIKE ?)")
        needle = f"%{q.lower()}%"
        params.extend([needle, needle])

    sql = (
        "SELECT t.* FROM event_teams et "
        "JOIN teams t ON t.team_number = et.team_number "
        "WHERE " + " AND ".join(clauses) + " "
        "ORDER BY t.team_number ASC"
    )

    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [_team_row_to_dict(r) for r in rows]


@router.post("/{event_key}/teams", status_code=status.HTTP_201_CREATED)
def register_event_teams(event_key: str, payload: EventTeamRegister) -> dict[str, Any]:
    """Register one or more teams as attending this event.

    Bulk by design — a TBA sync or seed script wants to push the full
    attendance list (40-80 teams) in one round-trip.

    Edge cases:
      - Teams must already exist in the global `teams` catalog (FK
        constraint). Decide whether to upsert stub teams here or
        require the seed script to push teams before events. Latter
        is cleaner.
      - If `payload.team_numbers` is empty, the Pydantic model
        (`Field(min_length=1)`) already rejects it with 422.
    """
    with get_conn() as conn:
        exists = conn.execute(
            "SELECT 1 FROM events WHERE event_key = ?", (event_key,)
        ).fetchone()
        if exists is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="event not found")

        # event_teams has an FK to teams, so every team must already be in the
        # global catalog. Check up front and 400 with the offenders, rather than
        # letting the FK violation surface as an opaque 500.
        placeholders = ",".join("?" for _ in payload.team_numbers)
        present = {
            row["team_number"]
            for row in conn.execute(
                f"SELECT team_number FROM teams WHERE team_number IN ({placeholders})",
                payload.team_numbers,
            ).fetchall()
        }
        missing = [n for n in payload.team_numbers if n not in present]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"these teams are not in the catalog yet — create them first "
                    f"via PUT /api/teams/{{team_number}}: {missing}"
                ),
            )

        conn.executemany(
            "INSERT OR IGNORE INTO event_teams (event_key, team_number) VALUES (?, ?)",
            [(event_key, team_number) for team_number in payload.team_numbers],
        )
        attendance_count = conn.execute(
            "SELECT COUNT(*) FROM event_teams WHERE event_key = ?", (event_key,)
        ).fetchone()[0]

    return {
        "event_key": event_key,
        "registered": payload.team_numbers,
        "attendance_count": attendance_count,
    }


@router.delete(
    "/{event_key}/teams/{team_number}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def unregister_event_team(event_key: str, team_number: int) -> Response:
    """Remove one team from an event's attendance roster.

    Doesn't touch the global `teams` row — just the join.
    """
    with get_conn() as conn:
        cursor = conn.execute(
            "DELETE FROM event_teams WHERE event_key = ? AND team_number = ?",
            (event_key, team_number),
        )
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="team not registered for this event",
            )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
