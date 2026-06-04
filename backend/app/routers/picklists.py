"""Picklist CRUD — STUDENT EXERCISE.

Backs the Library / Manager pages in `pages/picklist/`. The frontend
currently owns the whole document shape via `picklists-store.jsx`; the
server's job is to persist that document and let multiple users share it.

This whole router is intentionally stubbed. Every endpoint has the route
decorator, the signature, and a detailed TODO docstring — the implementation
is yours. Use `teams.py` (full roster CRUD) and `submissions.py` (filtered
list reads) as reference patterns; the helpers and conventions there port
directly here.

Endpoints to implement:
  GET    /api/picklists                — list with kind/event/archived filters
  GET    /api/picklists/{id}           — one
  POST   /api/picklists                — create
  PATCH  /api/picklists/{id}           — partial update (also covers star/archive/rename)
  DELETE /api/picklists/{id}           — hard delete

Deliberately *not* exposing sub-resources like /picklists/{id}/rankings or
/picklists/{id}/slots — the Manager UI re-saves the whole document on edit,
so a single PATCH `{data: {...}}` is enough. Revisit if/when real-time collab
needs finer-grained ops to avoid lost updates.
"""
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

    TODO(student): implement.

    Approach (closely mirrors `submissions.py::list_submissions`):
      1. Build `clauses: list[str]` and `params: list[Any]` based on
         which query params were supplied.
         - `kind`     → `clauses.append("kind = ?"); params.append(kind)`
         - `event`    → `clauses.append("event_key = ?"); params.append(event)`
         - `archived` → `clauses.append("archived = ?"); params.append(1 if archived else 0)`
         - `owner`    → `clauses.append("owner = ?"); params.append(owner)`
      2. Build the WHERE: `where = f"WHERE {' AND '.join(clauses)}" if clauses else ""`
      3. Sort by `updated_at DESC, id DESC` so the most recently touched
         picklist surfaces first (matches Library's mental model).
      4. Append LIMIT/OFFSET to params at the end.
      5. Open `with get_conn() as conn:`, execute, return
         `[_row_to_dict(r) for r in rows]`.

    Why two-section split (Shared / My) on the Library page works:
      - The frontend can either call this once with no `kind` and split
        client-side, or call twice (`?kind=shared` and `?kind=my`).
        The API supports both.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )


@router.get("/{picklist_id}")
def get_picklist(picklist_id: str) -> dict[str, Any]:
    """Fetch one picklist by id.

    TODO(student): implement.

    Approach (one-line query, two-line handler):
      1. `with get_conn() as conn:` then
         `row = conn.execute("SELECT * FROM picklists WHERE id = ?", (picklist_id,)).fetchone()`
      2. If `row is None`, raise:
         `HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="picklist not found")`
      3. Otherwise return `_row_to_dict(row)`.

    Reference: identical shape to `submissions.py::get_submission`.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )


# ---------------------------------------------------------------------------
# WRITE
# ---------------------------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
def create_picklist(payload: PicklistCreate, response: Response) -> dict[str, Any]:
    """Create a picklist.

    TODO(student): implement.

    Approach:
      1. Pick an id. If `payload.id` was supplied, use it (lets the UI
         keep an id it generated offline). Otherwise mint one:
         `picklist_id = f"pl_{uuid.uuid4().hex[:12]}"`.
      2. Serialize the `data` blob deterministically:
         `serialized = json.dumps(payload.data, sort_keys=True, separators=(",", ":"))`
      3. Open `with get_conn() as conn:`:
           a. SELECT 1 with the id; if a row exists, raise:
              `HTTPException(status_code=status.HTTP_409_CONFLICT,
               detail=f"picklist with id {picklist_id!r} already exists")`.
           b. INSERT into picklists with all the columns:
              `(id, title, event_key, kind, owner, starred, archived, data)`
              — remember to coerce starred/archived bools to 0/1.
           c. SELECT * back and return `_row_to_dict(row)`.
      4. The decorator already sets 201 via `status_code=status.HTTP_201_CREATED`.

    Why 409 on collision (instead of upsert):
      - Picklist creates are user actions, not retries. A duplicate id
        is almost certainly a bug — fail loud rather than silently
        clobber a different document.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )


@router.patch("/{picklist_id}")
def update_picklist(picklist_id: str, payload: PicklistUpdate) -> dict[str, Any]:
    """Partial update. Powers every mutating action on Library/Manager:

      - Rename               → PATCH {title}
      - Toggle star          → PATCH {starred}
      - Archive / restore    → PATCH {archived}
      - Save manager edits   → PATCH {data: {...full document...}}

    `data`, when present, is REPLACED wholesale. NO deep merge. The
    frontend already builds the full document in memory, so the server
    stays simple and avoids "what if a key was deleted" edge cases.

    TODO(student): implement.

    Approach (dynamic SQL — be careful, this is the trickiest endpoint):
      1. `update = payload.model_dump(exclude_unset=True)` — only the
         fields the client actually sent.
      2. If `update` is empty, no-op: return `get_picklist(picklist_id)`
         (so the client can refresh without a special-case 304).
      3. Build `sets: list[str]` and `params: list[Any]`:
         - For string/optional-string columns (`title`, `event_key`,
           `kind`, `owner`): if the key is in `update`, append
           `f"{column} = ?"` and the raw value.
         - For bool columns (`starred`, `archived`): if in `update`,
           append `f"{column} = ?"` and `1 if update[column] else 0`.
         - For `data`: if in `update`, append `"data = ?"` and
           `json.dumps(update["data"], sort_keys=True, separators=(",", ":"))`.
      4. Always tack on `sets.append("updated_at = datetime('now')")`.
      5. Append `picklist_id` to params (for the WHERE clause).
      6. Execute `f"UPDATE picklists SET {', '.join(sets)} WHERE id = ?"`.
      7. If `cursor.rowcount == 0`, raise 404.
      8. SELECT * and return `_row_to_dict(row)`.

    NEVER f-string user values into the SQL — only column names (which
    you control) go via f-string. All values bind through `?` placeholders.

    Why one PATCH endpoint for everything:
      - "Rename" and "save the whole document" are the same operation
        at the API level — they both write a subset of columns. Don't
        invent separate /rename or /star endpoints; one PATCH covers
        them all.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )


@router.delete("/{picklist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_picklist(picklist_id: str) -> Response:
    """Hard delete a picklist.

    TODO(student): implement.

    Approach:
      1. `cursor = conn.execute("DELETE FROM picklists WHERE id = ?", (picklist_id,))`
      2. If `cursor.rowcount == 0`, raise 404.
      3. Return `Response(status_code=status.HTTP_204_NO_CONTENT)`.

    Note: the Library's dropdown has both "Archive" (a PATCH that sets
    `archived=true`) and "Delete" (this endpoint, which removes the row).
    Don't conflate them.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )
