"""Teams router — global catalog + per-team submission reads.

Two concerns live here, both keyed by team_number:

  1. The roster itself: name, drivetrain, image, etc. (table: `teams`).
     Read by AddRobotDialog, RobotData search, RobotCard headers.
  2. The submissions filed about a team (view over: `submissions`).
     Read by anything that wants raw scouting data for one team
     (subjective notes dialog, future analytics aggregators).

Event-scoped roster reads ("who is at SVR") live in `events.py` —
this router stays event-agnostic.
"""
import json
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, status

from ..db import get_conn
from ..models import SubmissionType, TeamUpsert

router = APIRouter(prefix="/api/teams", tags=["teams"])


def _team_row_to_dict(row) -> dict[str, Any]:
    d = dict(row)
    d["data"] = json.loads(d["data"]) if d.get("data") else {}
    return d


def _submission_row_to_dict(row) -> dict[str, Any]:
    d = dict(row)
    d["data"] = json.loads(d["data"]) if d.get("data") else {}
    return d


# ---------------------------------------------------------------------------
# Roster reads
# ---------------------------------------------------------------------------

@router.get("")
def list_teams(
    q: Optional[str] = Query(default=None, description="Substring match on team_number or name"),
    limit: int = Query(default=500, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
) -> list[dict[str, Any]]:
    """Global team catalog.

    Returns *every* team we know about. For "teams at this event," use
    `GET /api/events/{event_key}/teams` instead — that's almost always
    what the UI actually wants. This endpoint exists for admin tools and
    for the (rare) case where the UI needs to look up a team that isn't
    registered to any event yet.

    TODO(impl):
      - When `q` is provided we do a naive LIKE. Fine at FRC scale
        (~10k teams); swap for FTS5 if it gets slow.
    """
    clauses: list[str] = []
    params: list[Any] = []
    if q:
        clauses.append("(CAST(team_number AS TEXT) LIKE ? OR LOWER(name) LIKE ?)")
        needle = f"%{q.lower()}%"
        params.extend([needle, needle])

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"SELECT * FROM teams {where} ORDER BY team_number ASC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [_team_row_to_dict(r) for r in rows]


@router.get("/{team_number}")
def get_team(team_number: int) -> dict[str, Any]:
    """Single team. Used by RobotCard and StrategyDetail headers."""
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM teams WHERE team_number = ?", (team_number,)
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="team not found")
    return _team_row_to_dict(row)


# ---------------------------------------------------------------------------
# Roster writes (admin / seed only)
# ---------------------------------------------------------------------------

@router.put("/{team_number}", status_code=status.HTTP_200_OK)
def upsert_team(team_number: int, payload: TeamUpsert) -> dict[str, Any]:
    """Insert or update a single team. Idempotent.

    TODO(impl):
      - Lock down once auth lands. Today anyone with API access can
        rewrite the roster.
      - Add a bulk endpoint (`POST /api/teams/bulk`) for the seed script
        so we're not doing N round-trips for ~60 teams.
      - If `team_number` in the URL and `payload.team_number` disagree,
        trust the URL (we already do this — easier than 422-ing here).
    """
    if payload.team_number != team_number:
        payload = payload.model_copy(update={"team_number": team_number})

    serialized = json.dumps(payload.data, sort_keys=True, separators=(",", ":"))

    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO teams (team_number, name, data, updated_at)
            VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT(team_number) DO UPDATE SET
              name       = excluded.name,
              data       = excluded.data,
              updated_at = datetime('now')
            """,
            (team_number, payload.name, serialized),
        )
        row = conn.execute(
            "SELECT * FROM teams WHERE team_number = ?", (team_number,)
        ).fetchone()
    return _team_row_to_dict(row)


# ---------------------------------------------------------------------------
# Per-team views over scouting submissions
# ---------------------------------------------------------------------------

@router.get("/{team_number}/submissions")
def team_submissions(
    team_number: int,
    type: Optional[SubmissionType] = None,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[dict[str, Any]]:
    """Raw submissions filed about this team.

    This is the read path for ScoutNotesDialog, the future analytics
    aggregator, and anything else that needs the unaggregated forms.
    Same filtering as `GET /api/submissions?team=<n>` but URL-keyed so
    "everything we have on team 5940" reads naturally.
    """
    clauses = ["team_number = ?"]
    params: list[Any] = [team_number]
    if type is not None:
        clauses.append("type = ?")
        params.append(type)

    sql = (
        "SELECT * FROM submissions WHERE "
        + " AND ".join(clauses)
        + " ORDER BY id DESC LIMIT ? OFFSET ?"
    )
    params.extend([limit, offset])

    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [_submission_row_to_dict(r) for r in rows]
