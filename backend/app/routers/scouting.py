import json
from typing import Any

from fastapi import APIRouter, HTTPException, Response, status

from ..db import get_conn
from ..models import (
    BreakSubmission,
    MatchSubmission,
    PitSubmission,
    SubmissionBase,
    SubmissionType,
    SubjectiveSubmission,
)

router = APIRouter(prefix="/api/scouting", tags=["scouting"])


def _row_to_dict(row) -> dict[str, Any]:
    d = dict(row)
    d["data"] = json.loads(d["data"]) if d.get("data") else {}
    return d


def _insert(payload: SubmissionBase, sub_type: SubmissionType, response: Response) -> dict[str, Any]:
    serialized = json.dumps(payload.data, sort_keys=True, separators=(",", ":"))

    with get_conn() as conn:
        if payload.client_uuid:
            existing = conn.execute(
                "SELECT * FROM submissions WHERE client_uuid = ?",
                (payload.client_uuid,),
            ).fetchone()
            if existing is not None:
                existing_d = _row_to_dict(existing)
                same = (
                    existing_d["type"] == sub_type
                    and existing_d["scout_name"] == payload.scout_name
                    and existing_d["team_number"] == payload.team_number
                    and existing_d["event_key"] == payload.event_key
                    and existing_d["match_number"] == payload.match_number
                    and existing_d["session_type"] == payload.session_type
                    and json.dumps(existing_d["data"], sort_keys=True, separators=(",", ":")) == serialized
                )
                if same:
                    response.status_code = status.HTTP_200_OK
                    return existing_d
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="client_uuid already used with a different payload",
                )

        cursor = conn.execute(
            """
            INSERT INTO submissions
              (type, scout_name, event_key, match_number, team_number, session_type, data, client_uuid)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                sub_type,
                payload.scout_name,
                payload.event_key,
                payload.match_number,
                payload.team_number,
                payload.session_type,
                serialized,
                payload.client_uuid,
            ),
        )
        new_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM submissions WHERE id = ?", (new_id,)).fetchone()

    response.status_code = status.HTTP_201_CREATED
    return _row_to_dict(row)


@router.post("/match", status_code=status.HTTP_201_CREATED)
def submit_match(payload: MatchSubmission, response: Response) -> dict[str, Any]:
    return _insert(payload, "match", response)


@router.post("/subjective", status_code=status.HTTP_201_CREATED)
def submit_subjective(payload: SubjectiveSubmission, response: Response) -> dict[str, Any]:
    return _insert(payload, "subjective", response)


@router.post("/pit", status_code=status.HTTP_201_CREATED)
def submit_pit(payload: PitSubmission, response: Response) -> dict[str, Any]:
    return _insert(payload, "pit", response)


@router.post("/break", status_code=status.HTTP_201_CREATED)
def submit_break(payload: BreakSubmission, response: Response) -> dict[str, Any]:
    return _insert(payload, "break", response)
