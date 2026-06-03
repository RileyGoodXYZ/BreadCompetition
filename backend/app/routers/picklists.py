"""Picklist CRUD.

Backs the Library / Manager pages in `pages/picklist/`. The frontend currently
owns the whole document shape via `picklists-store.jsx`; we mirror that here
by stashing the full body in `data: dict` and only hoisting the columns we
filter or sort by. Same modeling story as `submissions` — keep schema churn
out of the critical path until the UI stabilizes.

Endpoints:
  GET    /api/picklists                — list with kind/event/archived filters
  POST   /api/picklists                — create
  GET    /api/picklists/{id}           — one
  PATCH  /api/picklists/{id}           — partial update (also covers star/archive/rename)
  DELETE /api/picklists/{id}           — hard delete (UI's "Delete" action)

Deliberately *not* exposing sub-resources like /picklists/{id}/rankings or
/picklists/{id}/slots yet — the manager UI re-saves the whole document on
edit, so a single PATCH `{data: {...}}` is enough. Revisit if/when we add
real-time collab and need finer-grained ops to avoid lost updates.
"""
import json
import uuid
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, Response, status

from ..db import get_conn
from ..models import PicklistCreate, PicklistKind, PicklistUpdate

router = APIRouter(prefix="/api/picklists", tags=["picklists"])


def _row_to_dict(row) -> dict[str, Any]:
    d = dict(row)
    d["data"] = json.loads(d["data"]) if d.get("data") else {}
    # SQLite stores BOOLEAN as INTEGER — coerce so the JSON response is
    # actually `true`/`false`, not 0/1.
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
        description="When omitted, returns both archived and active. The Library page calls "
                    "this twice (or once with no filter) and splits client-side.",
    ),
    owner: Optional[str] = None,
    limit: int = Query(default=200, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[dict[str, Any]]:
    """List picklists.

    TODO(impl):
      - The Library page wants to render Shared and My in two sections —
        clients can either call this once and split by `kind`, or call
        twice with `?kind=shared` and `?kind=my`. Pick one in the
        frontend; the API supports both.
      - `owner` is a placeholder. Once auth lands, default to the
        authenticated user when `kind=my` and ignore the query param.
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
    # Sort by updated_at so the "most recently touched" picklist surfaces
    # first — matches the Library page's mental model.
    sql = (
        f"SELECT * FROM picklists {where} "
        "ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?"
    )
    params.extend([limit, offset])

    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [_row_to_dict(r) for r in rows]


@router.get("/{picklist_id}")
def get_picklist(picklist_id: str) -> dict[str, Any]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM picklists WHERE id = ?", (picklist_id,)
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="picklist not found")
    return _row_to_dict(row)


# ---------------------------------------------------------------------------
# WRITE
# ---------------------------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
def create_picklist(payload: PicklistCreate, response: Response) -> dict[str, Any]:
    """Create a picklist.

    TODO(impl):
      - If `payload.id` is supplied, treat as upsert-on-conflict to match
        the way `picklists-store.jsx` currently mints client-side ids
        (`p-${Date.now()}`). For now we 409 on collision so the bug is
        loud during dev.
      - When auth exists: stamp `owner` from the session and reject
        client-supplied owner for `kind="my"`.
      - Consider returning the Location header per REST convention; not
        wired here because the frontend just uses the body.
    """
    picklist_id = payload.id or f"pl_{uuid.uuid4().hex[:12]}"
    serialized = json.dumps(payload.data, sort_keys=True, separators=(",", ":"))

    with get_conn() as conn:
        existing = conn.execute(
            "SELECT 1 FROM picklists WHERE id = ?", (picklist_id,)
        ).fetchone()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"picklist with id {picklist_id!r} already exists",
            )

        conn.execute(
            """
            INSERT INTO picklists
              (id, title, event_key, kind, owner, starred, archived, data)
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
        row = conn.execute(
            "SELECT * FROM picklists WHERE id = ?", (picklist_id,)
        ).fetchone()

    response.status_code = status.HTTP_201_CREATED
    return _row_to_dict(row)


@router.patch("/{picklist_id}")
def update_picklist(picklist_id: str, payload: PicklistUpdate) -> dict[str, Any]:
    """Partial update.

    Powers every mutating action on the Library and Manager pages:
      - Rename               → PATCH {title}
      - Toggle star          → PATCH {starred}
      - Archive / restore    → PATCH {archived}
      - Save manager edits   → PATCH {data: {...full document...}}

    `data`, when present, is REPLACED wholesale. There is no deep merge.
    The frontend already builds the full document in memory, so this keeps
    the server side simple and free of "what if a key was deleted" edge
    cases.

    TODO(impl):
      - When real-time collab arrives, replace blind PATCH with an
        operational-transform endpoint or at minimum an `If-Match: <etag>`
        check using `updated_at`. Today last write wins.
    """
    update = payload.model_dump(exclude_unset=True)
    if not update:
        # No-op update — return current row so the UI can refresh without
        # special-casing 304.
        return get_picklist(picklist_id)

    sets: list[str] = []
    params: list[Any] = []

    for column in ("title", "event_key", "kind", "owner"):
        if column in update:
            sets.append(f"{column} = ?")
            params.append(update[column])

    for column in ("starred", "archived"):
        if column in update:
            sets.append(f"{column} = ?")
            params.append(1 if update[column] else 0)

    if "data" in update:
        sets.append("data = ?")
        params.append(json.dumps(update["data"], sort_keys=True, separators=(",", ":")))

    sets.append("updated_at = datetime('now')")
    params.append(picklist_id)

    with get_conn() as conn:
        cursor = conn.execute(
            f"UPDATE picklists SET {', '.join(sets)} WHERE id = ?",
            params,
        )
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="picklist not found"
            )
        row = conn.execute(
            "SELECT * FROM picklists WHERE id = ?", (picklist_id,)
        ).fetchone()
    return _row_to_dict(row)


@router.delete("/{picklist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_picklist(picklist_id: str) -> Response:
    """Hard delete.

    TODO(impl):
      - The Library's DropdownMenu has both "Archive" and "Delete". Archive
        is a PATCH; Delete is this. If we add a recycle bin later, switch
        to soft-delete with a `deleted_at` column instead of removing the
        row.
    """
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM picklists WHERE id = ?", (picklist_id,))
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="picklist not found"
            )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
