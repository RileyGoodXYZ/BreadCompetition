"""Match strategy CRUD.

Backs the Match Strategy Library and Detail pages in `pages/match-strategy/`.
Modeled identically to picklists: thin top-level columns for the fields we
filter or display in cards, and the full document body (alliances, scenarios,
columns, cells) lives in `data` as JSON.

Endpoints:
  GET    /api/strategies                — list with event/match filters
  POST   /api/strategies                — create
  GET    /api/strategies/{id}           — one
  PATCH  /api/strategies/{id}           — partial update (covers all in-page edits)
  DELETE /api/strategies/{id}           — hard delete

Like picklists, mutations on scenarios/columns/cells happen through the same
single PATCH endpoint by sending the updated `data` payload. Splitting those
out into nested routes is premature until we have collab or audit needs.
"""
import json
import uuid
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, Response, status

from ..db import get_conn
from ..models import Favored, StrategyCreate, StrategyUpdate

router = APIRouter(prefix="/api/strategies", tags=["strategies"])


def _row_to_dict(row) -> dict[str, Any]:
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

    TODO(impl):
      - The Library page renders an "Upcoming Matches" header. Once
        schedule data exists, sort by `match_number` ASC within the
        current event so it actually reads like a schedule.
      - Add an `?upcoming=true` filter that joins against the schedule
        and hides strategies for matches that have already played.
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
    sql = (
        f"SELECT * FROM strategies {where} "
        "ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?"
    )
    params.extend([limit, offset])

    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [_row_to_dict(r) for r in rows]


@router.get("/{strategy_id}")
def get_strategy(strategy_id: str) -> dict[str, Any]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM strategies WHERE id = ?", (strategy_id,)
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="strategy not found")
    return _row_to_dict(row)


# ---------------------------------------------------------------------------
# WRITE
# ---------------------------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
def create_strategy(payload: StrategyCreate, response: Response) -> dict[str, Any]:
    """Create a strategy.

    TODO(impl):
      - The NewStrategyDialog asks the user for `title`, `event`, and the
        six teams on the field. The frontend currently shoves alliances
        into `data.ourAlliance`/`data.opponentAlliance`. That's fine, but
        validate on the server that exactly 3 teams per side are present
        before accepting — bad shapes here surface as confusing UI bugs
        on Detail.
      - On creation, seed `data.scenarios` and `data.columns` with the
        defaults from `match-strategy-store.jsx::defaultScenarios` /
        `TIMELINE_COLUMNS` if the client didn't include them. Today the
        client always sends a fully-formed document, but the server
        should be defensive.
    """
    strategy_id = payload.id or f"st_{uuid.uuid4().hex[:12]}"
    serialized = json.dumps(payload.data, sort_keys=True, separators=(",", ":"))

    with get_conn() as conn:
        existing = conn.execute(
            "SELECT 1 FROM strategies WHERE id = ?", (strategy_id,)
        ).fetchone()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"strategy with id {strategy_id!r} already exists",
            )

        conn.execute(
            """
            INSERT INTO strategies
              (id, title, event_key, match_number, favored, data)
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
        row = conn.execute(
            "SELECT * FROM strategies WHERE id = ?", (strategy_id,)
        ).fetchone()

    response.status_code = status.HTTP_201_CREATED
    return _row_to_dict(row)


@router.patch("/{strategy_id}")
def update_strategy(strategy_id: str, payload: StrategyUpdate) -> dict[str, Any]:
    """Partial update; `data` (if present) is REPLACED wholesale.

    Powers every edit on the Detail page:
      - Add / remove scenario   → PATCH {data: {scenarios: [...]}}
      - Add / remove column     → PATCH {data: {columns: [...]}}
      - Type into a cell        → PATCH {data: {scenarios: [..updated cells..]}}
      - Edit title / event      → PATCH {title, event_key}

    TODO(impl):
      - The Detail page calls `setCell` on every keystroke. If we wire it
        directly to PATCH, debounce on the client (250–500ms) to avoid
        hammering the server. Alternatively expose a dedicated
        `PATCH /api/strategies/{id}/cell` that takes scenarioId/teamNum/
        columnId/value and applies a JSON patch inside the DB — cheaper
        and more collab-friendly. Defer until we feel the pain.
      - Add `If-Match: <updated_at>` optimistic concurrency before two
        strategists can edit the same match at the same time without
        clobbering each other.
    """
    update = payload.model_dump(exclude_unset=True)
    if not update:
        return get_strategy(strategy_id)

    sets: list[str] = []
    params: list[Any] = []

    for column in ("title", "event_key", "match_number", "favored"):
        if column in update:
            sets.append(f"{column} = ?")
            params.append(update[column])

    if "data" in update:
        sets.append("data = ?")
        params.append(json.dumps(update["data"], sort_keys=True, separators=(",", ":")))

    sets.append("updated_at = datetime('now')")
    params.append(strategy_id)

    with get_conn() as conn:
        cursor = conn.execute(
            f"UPDATE strategies SET {', '.join(sets)} WHERE id = ?",
            params,
        )
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="strategy not found"
            )
        row = conn.execute(
            "SELECT * FROM strategies WHERE id = ?", (strategy_id,)
        ).fetchone()
    return _row_to_dict(row)


@router.delete("/{strategy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_strategy(strategy_id: str) -> Response:
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM strategies WHERE id = ?", (strategy_id,))
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="strategy not found"
            )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
