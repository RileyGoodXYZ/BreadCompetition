import json
import uuid
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, Response, status

from ..db import get_conn
from ..models import Favored, StrategyCreate, StrategyUpdate

router = APIRouter(prefix="/api/strategies", tags=["strategies"])


def _row_to_dict(row) -> dict[str, Any]:
    """Convert a sqlite3.Row to a JSON-friendly dict.
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

    Once a real match schedule exists (see `events.py::list_event_matches`):
      - The Library page renders an "Upcoming Matches" header. Sort by
        `match_number` ASC within the current event so it reads like a
        schedule, and consider an `?upcoming=true` filter that hides
        strategies for matches that have already played.
    """
    clauses: list[str] = []
    params: list[Any] = []

    if event is not None:
        clauses.append("event_key = ?")
        params.append(event)
    if match is not None:
        clauses.append("match_number = ?")
        params.append(match)
    if favored is not None:
        clauses.append("favored = ?")
        params.append(favored)

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"SELECT * FROM strategies {where} ORDER BY id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [_row_to_dict(r) for r in rows]


@router.get("/{strategy_id}")
def get_strategy(strategy_id: str) -> dict[str, Any]:
    """Fetch one strategy by id.
    """

    with get_conn() as conn:
      row = conn.execute("SELECT * FROM strategies WHERE id = ?", (strategy_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")
    return _row_to_dict(row)


# ---------------------------------------------------------------------------
# WRITE
# ---------------------------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
def create_strategy(payload: StrategyCreate, response: Response) -> dict[str, Any]:
    """Create a strategy.

    Worth validating once it works:
      - The NewStrategyDialog collects `title`, `event`, and the six teams on
        the field, shoved into `data.ourAlliance` / `data.opponentAlliance`.
        Validate exactly 3 teams per side before accepting — bad shapes here
        surface as confusing UI bugs on the Detail page.
      - Be defensive: if the client didn't include `data.scenarios` /
        `data.columns`, seed them from the store's defaults so Detail always
        has something to render.
    """
    if payload.id is not None:
        strategy_id = payload.id
    else:
        strategy_id = f"st_{uuid.uuid4().hex[:12]}"
    serialized = json.dumps(payload.data, sort_keys=True, separators=(",", ":"))
    with get_conn() as conn:
        existing = conn.execute("SELECT 1 FROM strategies WHERE id = ?", (strategy_id,)).fetchone()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Strategy with id {strategy_id!r} already exists",
            )
        conn.execute(
            """
            INSERT INTO strategies (id, title, event_key, match_number, favored, data)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                strategy_id,
                payload.title,
                payload.event_key,
                payload.match_number,
                payload.favored,
                serialized,
            ),
        )
        row = conn.execute("SELECT * FROM strategies WHERE id = ?", (strategy_id,)).fetchone()
    return _row_to_dict(row)


@router.patch("/{strategy_id}")
def update_strategy(strategy_id: str, payload: StrategyUpdate) -> dict[str, Any]:
    """Partial update. Powers every edit on the Detail page: Add / remove scenario, Add / remove column, Type into a cell, Edit title / event.

    Things you'll hit once strategists actually use it:
      - The Detail page calls `setCell` on every keystroke. Debounce on the
        client (250–500ms) before firing PATCH, or expose a dedicated
        `PATCH /api/strategies/{id}/cell` that applies a single-cell JSON
        patch in the DB. Defer the dedicated route until you feel the pain.
      - Add `If-Match: <updated_at>` optimistic concurrency before two
        strategists can edit the same match without clobbering each other.
    """
    update = payload.model_dump(exclude_unset=True)
    if not update:
        return get_strategy(strategy_id)

    sets: list[str] = []
    params: list[Any] = []

    for column in ["title", "event_key", "match_number", "favored"]:
        if column in update:
            sets.append(f"{column} = ?")
            params.append(update[column])
    if "data" in update:
        sets.append("data = ?")
        params.append(json.dumps(update["data"], sort_keys=True, separators=(",", ":")))

    sets.append("updated_at = datetime('now')")
    params.append(strategy_id)

    with get_conn() as conn:
        cursor = conn.execute(f"UPDATE strategies SET {', '.join(sets)} WHERE id = ?", params)
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")
        row = conn.execute("SELECT * FROM strategies WHERE id = ?", (strategy_id,)).fetchone()
    return _row_to_dict(row)


@router.delete("/{strategy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_strategy(strategy_id: str) -> Response:
    """Hard delete a strategy.
    """
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM strategies WHERE id = ?", (strategy_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
