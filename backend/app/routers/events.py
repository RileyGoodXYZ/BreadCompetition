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
from ..models import EventTeamRegister, EventUpsert, MatchScheduleBulkUpsert

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
# Match schedule
#
# Clauded code just for schedules to exist. Subject to change after TBA integration.
#
# Reads the `matches` table. Write side is a bulk PUT (full-replace for
# the event) so a TBA sync job or the seed script can push the whole
# schedule in one round-trip without per-match diffing.
# ---------------------------------------------------------------------------

COMP_LEVEL_LABEL = {"qm": "Qual", "qf": "Quarter", "sf": "Semi", "f": "Final"}


def _match_row_to_dict(row) -> dict[str, Any]:
    """Shape one DB row into the format the frontend renders directly.

    Keep the field names in sync with `frontend/src/pages/picklist/RobotData.jsx`
    and `frontend/src/pages/Home.jsx` so the UI can consume the response
    with zero adaptation. `data` holds the display fields the UI shows
    verbatim (scheduledAt, field, startsInLabel) — until we have real
    timestamps the seed script writes them as strings.
    """
    data = json.loads(row["data"]) if row["data"] else {}
    comp_level = row["comp_level"]
    return {
        "id": f"{comp_level}-{row['match_number']}",
        "comp_level": comp_level,
        "number": row["match_number"],
        "type": COMP_LEVEL_LABEL.get(comp_level, comp_level.upper()),
        "scheduledAt": data.get("scheduledAt"),
        "startsInLabel": data.get("startsInLabel"),
        "field": data.get("field"),
        "red": [str(n) for n in json.loads(row["red_alliance"])],
        "blue": [str(n) for n in json.loads(row["blue_alliance"])],
    }


@router.get("/{event_key}/matches")
def list_event_matches(
    event_key: str,
    team: Optional[int] = Query(default=None, description="Filter to matches a team is playing in"),
) -> list[dict[str, Any]]:
    """Match schedule for an event, ordered by play order.

    `?team=` filters server-side to matches a team is playing in (either
    alliance). Frontend RobotData uses this to ask "what's the next match
    for team N at this event."
    """
    sql = (
        "SELECT * FROM matches WHERE event_key = ? "
        "ORDER BY CASE comp_level WHEN 'qm' THEN 0 WHEN 'qf' THEN 1 "
        "WHEN 'sf' THEN 2 WHEN 'f' THEN 3 END, match_number ASC"
    )
    with get_conn() as conn:
        rows = conn.execute(sql, (event_key,)).fetchall()

    matches = [_match_row_to_dict(r) for r in rows]
    if team is not None:
        needle = str(team)
        matches = [m for m in matches if needle in m["red"] or needle in m["blue"]]
    return matches


@router.put("/{event_key}/matches", status_code=status.HTTP_200_OK)
def upsert_event_matches(
    event_key: str, payload: MatchScheduleBulkUpsert
) -> dict[str, Any]:
    """Replace the schedule for one event in a single round-trip.

    Bulk by design — a TBA sync job or seed script wants to push 76 quals
    + playoffs at once. Existing rows are upserted on (event_key,
    comp_level, match_number); rows not in the payload are deleted so
    re-running the seed converges on the canonical schedule.

    Privileged write — lock this down with the rest when auth lands.
    """
    with get_conn() as conn:
        exists = conn.execute(
            "SELECT 1 FROM events WHERE event_key = ?", (event_key,)
        ).fetchone()
        if exists is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="event not found"
            )

        keep = {(m.comp_level, m.match_number) for m in payload.matches}
        existing_keys = {
            (row["comp_level"], row["match_number"])
            for row in conn.execute(
                "SELECT comp_level, match_number FROM matches WHERE event_key = ?",
                (event_key,),
            ).fetchall()
        }
        to_delete = existing_keys - keep
        if to_delete:
            conn.executemany(
                "DELETE FROM matches WHERE event_key = ? AND comp_level = ? AND match_number = ?",
                [(event_key, cl, mn) for cl, mn in to_delete],
            )

        conn.executemany(
            """
            INSERT INTO matches (event_key, comp_level, match_number,
                                 red_alliance, blue_alliance, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(event_key, comp_level, match_number) DO UPDATE SET
              red_alliance  = excluded.red_alliance,
              blue_alliance = excluded.blue_alliance,
              data          = excluded.data,
              updated_at    = datetime('now')
            """,
            [
                (
                    event_key,
                    m.comp_level,
                    m.match_number,
                    json.dumps(m.red_alliance, separators=(",", ":")),
                    json.dumps(m.blue_alliance, separators=(",", ":")),
                    json.dumps(m.data, sort_keys=True, separators=(",", ":")),
                )
                for m in payload.matches
            ],
        )

        count = conn.execute(
            "SELECT COUNT(*) FROM matches WHERE event_key = ?", (event_key,)
        ).fetchone()[0]

    return {"event_key": event_key, "match_count": count}
