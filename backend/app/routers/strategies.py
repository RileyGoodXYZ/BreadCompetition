"""Match strategy CRUD — STUDENT EXERCISE.

Backs the Match Strategy Library and Detail pages in `pages/match-strategy/`.
The frontend currently owns the whole document shape via
`match-strategy-store.jsx`; the server's job is to persist that document
(alliances, scenarios, columns, cells) and let strategists share it.

This whole router is intentionally stubbed. Every endpoint has the route
decorator, the signature, and a detailed TODO docstring — the implementation
is yours. Use `teams.py` (full roster CRUD) and `submissions.py` (filtered
list reads) as reference patterns; the helpers and conventions there port
directly here. It's also modeled identically to `picklists.py`, so once you
finish that exercise this one is the same shape with different columns.

Endpoints to implement:
  GET    /api/strategies                — list with event/match/favored filters
  GET    /api/strategies/{id}           — one
  POST   /api/strategies                — create
  PATCH  /api/strategies/{id}           — partial update (covers every in-page edit)
  DELETE /api/strategies/{id}           — hard delete

Like picklists, edits to scenarios / columns / cells all go through the single
PATCH endpoint by sending the updated `data` payload. Splitting those into
nested routes is premature until we have collab or audit needs.
"""
import json
import uuid
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, Response, status

from ..db import get_conn
from ..models import Favored, StrategyCreate, StrategyUpdate

router = APIRouter(prefix="/api/strategies", tags=["strategies"])


def _row_to_dict(row) -> dict[str, Any]:
    """Convert a sqlite3.Row to a JSON-friendly dict.

    JSON-decodes the `data` column (stored as TEXT). Strategies have no
    boolean columns, so unlike `picklists._row_to_dict` there's nothing to
    coerce here — keep it this simple.
    """
    d = dict(row)
    d["data"] = json.loads(d["data"]) if d.get("data") else {}
    return d


# ---------------------------------------------------------------------------
# READ
# ---------------------------------------------------------------------------

@router.get("")
def list_strategies(
    event: Optional[str] = None,
    match: Optional[int] = Query(default=None, ge=0),
    favored: Optional[Favored] = None,
    limit: int = Query(default=200, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[dict[str, Any]]:
    """List strategies, newest-touched first.

    TODO(student): implement.

    Approach (closely mirrors `submissions.py::list_submissions`):
      1. Build `clauses: list[str]` and `params: list[Any]` from whichever
         query params were supplied:
         - `event`   → `clauses.append("event_key = ?"); params.append(event)`
         - `match`   → `clauses.append("match_number = ?"); params.append(match)`
         - `favored` → `clauses.append("favored = ?"); params.append(favored)`
      2. Build the WHERE: `where = f"WHERE {' AND '.join(clauses)}" if clauses else ""`
      3. Sort by `updated_at DESC, id DESC` so the most recently edited
         strategy surfaces first.
      4. Append LIMIT/OFFSET to params at the end.
      5. Open `with get_conn() as conn:`, execute, return
         `[_row_to_dict(r) for r in rows]`.

    Once a real match schedule exists (see `events.py::list_event_matches`):
      - The Library page renders an "Upcoming Matches" header. Sort by
        `match_number` ASC within the current event so it reads like a
        schedule, and consider an `?upcoming=true` filter that hides
        strategies for matches that have already played.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )


@router.get("/{strategy_id}")
def get_strategy(strategy_id: str) -> dict[str, Any]:
    """Fetch one strategy by id.

    TODO(student): implement.

    Approach (one-line query, two-line handler):
      1. `with get_conn() as conn:` then
         `row = conn.execute("SELECT * FROM strategies WHERE id = ?", (strategy_id,)).fetchone()`
      2. If `row is None`, raise:
         `HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="strategy not found")`
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
def create_strategy(payload: StrategyCreate, response: Response) -> dict[str, Any]:
    """Create a strategy.

    TODO(student): implement.

    Approach (mirrors `picklists.py::create_picklist`):
      1. Pick an id. If `payload.id` was supplied, use it (lets the UI keep
         an id it generated offline). Otherwise mint one:
         `strategy_id = f"st_{uuid.uuid4().hex[:12]}"`.
      2. Serialize the `data` blob deterministically:
         `serialized = json.dumps(payload.data, sort_keys=True, separators=(",", ":"))`
      3. Open `with get_conn() as conn:`:
           a. SELECT 1 with the id; if a row exists, raise:
              `HTTPException(status_code=status.HTTP_409_CONFLICT,
               detail=f"strategy with id {strategy_id!r} already exists")`.
           b. INSERT into strategies with the columns
              `(id, title, event_key, match_number, favored, data)`.
           c. SELECT * back and return `_row_to_dict(row)`.
      4. The decorator already sets 201 via `status_code=status.HTTP_201_CREATED`.

    Worth validating once it works:
      - The NewStrategyDialog collects `title`, `event`, and the six teams on
        the field, shoved into `data.ourAlliance` / `data.opponentAlliance`.
        Validate exactly 3 teams per side before accepting — bad shapes here
        surface as confusing UI bugs on the Detail page.
      - Be defensive: if the client didn't include `data.scenarios` /
        `data.columns`, seed them from the store's defaults so Detail always
        has something to render.

    Why 409 on collision (instead of upsert):
      - Strategy creates are user actions, not retries. A duplicate id is
        almost certainly a bug — fail loud rather than clobber a different doc.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )


@router.patch("/{strategy_id}")
def update_strategy(strategy_id: str, payload: StrategyUpdate) -> dict[str, Any]:
    """Partial update. Powers every edit on the Detail page:

      - Add / remove scenario   → PATCH {data: {scenarios: [...]}}
      - Add / remove column     → PATCH {data: {columns: [...]}}
      - Type into a cell        → PATCH {data: {scenarios: [..updated cells..]}}
      - Edit title / event      → PATCH {title, event_key}

    `data`, when present, is REPLACED wholesale. NO deep merge. The frontend
    already builds the full document in memory, so the server stays simple and
    avoids "what if a key was deleted" edge cases.

    TODO(student): implement.

    Approach (dynamic SQL — the trickiest endpoint; same as picklists' PATCH):
      1. `update = payload.model_dump(exclude_unset=True)` — only the fields
         the client actually sent.
      2. If `update` is empty, no-op: return `get_strategy(strategy_id)` (so
         the client can refresh without a special-case 304).
      3. Build `sets: list[str]` and `params: list[Any]`:
         - For columns `title`, `event_key`, `match_number`, `favored`: if the
           key is in `update`, append `f"{column} = ?"` and the raw value.
         - For `data`: if in `update`, append `"data = ?"` and
           `json.dumps(update["data"], sort_keys=True, separators=(",", ":"))`.
      4. Always tack on `sets.append("updated_at = datetime('now')")`.
      5. Append `strategy_id` to params (for the WHERE clause).
      6. Execute `f"UPDATE strategies SET {', '.join(sets)} WHERE id = ?"`.
      7. If `cursor.rowcount == 0`, raise 404.
      8. SELECT * and return `_row_to_dict(row)`.

    NEVER f-string user values into the SQL — only column names (which you
    control) go via f-string. All values bind through `?` placeholders.

    Things you'll hit once strategists actually use it:
      - The Detail page calls `setCell` on every keystroke. Debounce on the
        client (250–500ms) before firing PATCH, or expose a dedicated
        `PATCH /api/strategies/{id}/cell` that applies a single-cell JSON
        patch in the DB. Defer the dedicated route until you feel the pain.
      - Add `If-Match: <updated_at>` optimistic concurrency before two
        strategists can edit the same match without clobbering each other.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )


@router.delete("/{strategy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_strategy(strategy_id: str) -> Response:
    """Hard delete a strategy.

    TODO(student): implement.

    Approach:
      1. `cursor = conn.execute("DELETE FROM strategies WHERE id = ?", (strategy_id,))`
      2. If `cursor.rowcount == 0`, raise 404.
      3. Return `Response(status_code=status.HTTP_204_NO_CONTENT)`.

    Reference: `picklists.py::delete_picklist` does the exact same dance.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TODO(student): see docstring",
    )
