import json
from typing import Any, Optional

from fastapi import APIRouter, Query

from ..db import get_conn
from ..models import SubmissionType

router = APIRouter(prefix="/api/teams", tags=["teams"])


def _row_to_dict(row) -> dict[str, Any]:
    d = dict(row)
    d["data"] = json.loads(d["data"]) if d.get("data") else {}
    return d


@router.get("/{team_number}/submissions")
def team_submissions(
    team_number: int,
    type: Optional[SubmissionType] = None,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[dict[str, Any]]:
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
    return [_row_to_dict(r) for r in rows]
