import json
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, status

from ..db import get_conn
from ..models import SubmissionType

router = APIRouter(prefix="/api/submissions", tags=["submissions"])


def _row_to_dict(row) -> dict[str, Any]:
    d = dict(row)
    d["data"] = json.loads(d["data"]) if d.get("data") else {}
    return d


@router.get("")
def list_submissions(
    type: Optional[SubmissionType] = None,
    team: Optional[int] = Query(default=None, ge=0),
    match: Optional[int] = Query(default=None, ge=0),
    event: Optional[str] = None,
    scout: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[dict[str, Any]]:
    clauses: list[str] = []
    params: list[Any] = []

    if type is not None:
        clauses.append("type = ?")
        params.append(type)
    if team is not None:
        clauses.append("team_number = ?")
        params.append(team)
    if match is not None:
        clauses.append("match_number = ?")
        params.append(match)
    if event is not None:
        clauses.append("event_key = ?")
        params.append(event)
    if scout is not None:
        clauses.append("scout_name = ?")
        params.append(scout)

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"SELECT * FROM submissions {where} ORDER BY id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [_row_to_dict(r) for r in rows]


@router.get("/{submission_id}")
def get_submission(submission_id: int) -> dict[str, Any]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM submissions WHERE id = ?", (submission_id,)
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="submission not found")
    return _row_to_dict(row)
