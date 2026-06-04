import json
import uuid
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, Response, status

from ..db import get_conn
from ..models import PicklistCreate, PicklistKind, PicklistUpdate

router = APIRouter(prefix="/api/picklists", tags=["picklists"])


def _row_to_dict(row) -> dict[str, Any]:
    """Convert a sqlite3.Row to a JSON-friendly dict.

    Does two things you'll need everywhere in this file:
      1. JSON-decodes the `data` column (it's stored as TEXT).
      2. Coerces SQLite booleans (stored as INTEGER 0/1) to real bools
         so the response JSON has `true`/`false`, not `0`/`1`.
    """
    d = dict(row)
    d["data"] = json.loads(d["data"]) if d.get("data") else {}
    d["starred"] = bool(d.get("starred"))
    d["archived"] = bool(d.get("archived"))
    return d


# ---------------------------------------------------------------------------
# READ
# ---------------------------------------------------------------------------

@router.get("")
def list_picklists(
    kind: Optional[PicklistKind] = None,
    event: Optional[str] = None,
    archived: Optional[bool] = Query(
        default=None,
        description="When omitted, returns both archived and active.",
    ),
    owner: Optional[str] = None,
    limit: int = Query(default=200, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[dict[str, Any]]:
    """List picklists, newest-touched first.
    """
    clauses: list[str] = []
    params: list[Any] = []

    if kind is not None:
        clauses.append("kind = ?")
        params.append(kind)
    if event is not None:
        clauses.append("event_key = ?")
        params.append(event)
    if archived is not None:
        clauses.append("archived = ?")
        params.append(1 if archived else 0)
    if owner is not None:
        clauses.append("owner = ?")
        params.append(owner)

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"SELECT * FROM picklists {where} ORDER BY id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [_row_to_dict(r) for r in rows]


@router.get("/{picklist_id}")
def get_picklist(picklist_id: str) -> dict[str, Any]:
    """Fetch one picklist by id.

    Reference: identical shape to `submissions.py::get_submission`.
    """
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM picklists WHERE id = ?", (picklist_id,)
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Picklist not found")
    return _row_to_dict(row)


# ---------------------------------------------------------------------------
# WRITE
# ---------------------------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
def create_picklist(payload: PicklistCreate, response: Response) -> dict[str, Any]:
    """Create a picklist.
    """
    if payload.id is not None:
        picklist_id = payload.id
    else:
        picklist_id = f"pl_{uuid.uuid4().hex[:12]}"
    serialized = json.dumps(payload.data, sort_keys=True, separators=(",", ":"))
    with get_conn() as conn:
        existing = conn.execute("SELECT 1 FROM picklists WHERE id = ?", (picklist_id,)).fetchone()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Picklist with id {picklist_id!r} already exists",
            )
        conn.execute(
            """
            INSERT INTO picklists (id, title, event_key, kind, owner, starred, archived, data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                picklist_id,
                payload.title,
                payload.event_key,
                payload.kind,
                payload.owner,
                1 if payload.starred else 0,
                1 if payload.archived else 0,
                serialized,
            ),
        )
        row = conn.execute("SELECT * FROM picklists WHERE id = ?", (picklist_id,)).fetchone()
    return _row_to_dict(row)


@router.patch("/{picklist_id}")
def update_picklist(picklist_id: str, payload: PicklistUpdate) -> dict[str, Any]:
    """Partial update. Powers every mutating action on Library/Manager: Rename, Toggle star, Archive/restore, Save edits. 
    """
    update = payload.model_dump(exclude_unset=True)
    if not update:
        return get_picklist(picklist_id)

    sets: list[str] = []
    params: list[Any] = []

    for column in ["title", "event_key", "kind", "owner"]:
        if column in update:
            sets.append(f"{column} = ?")
            params.append(update[column])
    for column in ["starred", "archived"]:
        if column in update:
            sets.append(f"{column} = ?")
            params.append(1 if update[column] else 0)
    if "data" in update:
        sets.append("data = ?")
        params.append(json.dumps(update["data"], sort_keys=True, separators=(",", ":")))

    sets.append("updated_at = datetime('now')")
    params.append(picklist_id)

    with get_conn() as conn:
        cursor = conn.execute(f"UPDATE picklists SET {', '.join(sets)} WHERE id = ?", params)
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Picklist not found")
        row = conn.execute("SELECT * FROM picklists WHERE id = ?", (picklist_id,)).fetchone()
    return _row_to_dict(row)


@router.delete("/{picklist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_picklist(picklist_id: str) -> Response:
    """Hard delete a picklist.

    Approach:
      1. `cursor = conn.execute("DELETE FROM picklists WHERE id = ?", (picklist_id,))`
      2. If `cursor.rowcount == 0`, raise 404.
      3. Return `Response(status_code=status.HTTP_204_NO_CONTENT)`.
    """
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM picklists WHERE id = ?", (picklist_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Picklist not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)