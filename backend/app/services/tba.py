"""The Blue Alliance sync — pull an event's metadata, roster, and match
schedule from TBA into our local SQLite tables.

**Manual, on-demand only.** Someone hits `POST /api/tba/sync/{event_key}` when
there's an internet connection — typically before the event, or on a phone
hotspot between matches. There is deliberately no webhook and no background
poller: the scouting server runs on a laptop in the stands with no inbound
internet, so a push would never arrive. We pull when we can and serve from
SQLite the rest of the time.

Design is sync-into-SQLite (not a live proxy) so the data survives the venue's
(often non-existent) wifi. Everything is idempotent (`INSERT ... ON CONFLICT DO
UPDATE`), so re-syncing is always safe; catalog `data` blobs are shallow-merged
so a re-sync never destroys UI-added fields.

Docs: https://www.thebluealliance.com/apidocs/v3
"""
import json
import logging
from typing import Any, Optional

import httpx

from ..config import settings
from ..db import get_conn

log = logging.getLogger("tba")


class TBAError(RuntimeError):
    """TBA was unreachable, misconfigured, or returned an unexpected status."""


class TBANotFound(TBAError):
    """TBA has no such event key."""


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------

def _client() -> httpx.Client:
    if not settings.TBA_API_KEY:
        raise TBAError("TBA_API_KEY is not configured")
    return httpx.Client(
        base_url=settings.TBA_BASE_URL,
        headers={
            "X-TBA-Auth-Key": settings.TBA_API_KEY,
            "accept": "application/json",
        },
        timeout=15.0,
    )


def _get(client: httpx.Client, path: str) -> Any:
    resp = client.get(path)
    resp.raise_for_status()
    return resp.json()


# ---------------------------------------------------------------------------
# Mapping helpers (TBA shapes -> our rows)
# ---------------------------------------------------------------------------

def _team_number(team_key: str) -> Optional[int]:
    """`"frc5940"` -> `5940`. Returns None for anything that doesn't parse."""
    if team_key and team_key.startswith("frc"):
        try:
            return int(team_key[3:])
        except ValueError:
            return None
    return None


def _merge_data(existing_json: Optional[str], new_fields: dict[str, Any]) -> str:
    """Shallow-merge TBA fields onto whatever `data` already held, dropping
    keys TBA reported as null so we don't overwrite good data with None."""
    existing = json.loads(existing_json) if existing_json else {}
    existing.update({k: v for k, v in new_fields.items() if v is not None})
    return json.dumps(existing, sort_keys=True, separators=(",", ":"))


def _upsert_event(conn, event: dict[str, Any]) -> None:
    event_key = event["key"]
    name = event.get("name") or event_key
    row = conn.execute(
        "SELECT data FROM events WHERE event_key = ?", (event_key,)
    ).fetchone()
    data = _merge_data(
        row["data"] if row else None,
        {
            "shortName": event.get("short_name"),
            "city": event.get("city"),
            "stateProv": event.get("state_prov"),
            "country": event.get("country"),
            "startDate": event.get("start_date"),
            "endDate": event.get("end_date"),
            "year": event.get("year"),
            "eventType": event.get("event_type_string"),
            "week": event.get("week"),
            "source": "tba",
        },
    )
    conn.execute(
        """
        INSERT INTO events (event_key, name, data, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(event_key) DO UPDATE SET
          name = excluded.name, data = excluded.data, updated_at = datetime('now')
        """,
        (event_key, name, data),
    )


def _upsert_team(conn, team_number: int, team: dict[str, Any]) -> None:
    name = team.get("nickname") or team.get("name") or f"Team {team_number}"
    row = conn.execute(
        "SELECT data FROM teams WHERE team_number = ?", (team_number,)
    ).fetchone()
    data = _merge_data(
        row["data"] if row else None,
        {
            "nickname": team.get("nickname"),
            "fullName": team.get("name"),
            "city": team.get("city"),
            "stateProv": team.get("state_prov"),
            "country": team.get("country"),
            "source": "tba",
        },
    )
    conn.execute(
        """
        INSERT INTO teams (team_number, name, data, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(team_number) DO UPDATE SET
          name = excluded.name, data = excluded.data, updated_at = datetime('now')
        """,
        (team_number, name, data),
    )


def _upsert_match(conn, match: dict[str, Any]) -> None:
    match_key = match["key"]
    event_key = match.get("event_key") or match_key.split("_")[0]
    alliances = match.get("alliances") or {}
    red = alliances.get("red") or {}
    blue = alliances.get("blue") or {}

    def teams(side: dict[str, Any]) -> list[int]:
        keys = side.get("team_keys") or side.get("teams") or []
        return [n for n in (_team_number(k) for k in keys) if n is not None]

    data = json.dumps(
        {
            "red": teams(red),
            "blue": teams(blue),
            "red_score": red.get("score"),
            "blue_score": blue.get("score"),
            "time_string": match.get("time_string"),
            "source": "tba",
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    conn.execute(
        """
        INSERT INTO matches
          (match_key, event_key, comp_level, set_number, match_number,
           scheduled_time, predicted_time, actual_time, winning_alliance, data, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(match_key) DO UPDATE SET
          event_key = excluded.event_key, comp_level = excluded.comp_level,
          set_number = excluded.set_number, match_number = excluded.match_number,
          scheduled_time = excluded.scheduled_time, predicted_time = excluded.predicted_time,
          actual_time = excluded.actual_time, winning_alliance = excluded.winning_alliance,
          data = excluded.data, updated_at = datetime('now')
        """,
        (
            match_key,
            event_key,
            match.get("comp_level") or "qm",
            match.get("set_number") or 1,
            match.get("match_number") or 0,
            match.get("time"),
            match.get("predicted_time"),
            match.get("actual_time"),
            match.get("winning_alliance") or None,
            data,
        ),
    )


# ---------------------------------------------------------------------------
# The sync
# ---------------------------------------------------------------------------

def sync_event(event_key: str) -> dict[str, Any]:
    """Pull `event_key` from TBA and upsert it into events / teams /
    event_teams / matches. Idempotent; returns a small summary.

    Order matters for the foreign keys: the event row must exist before its
    attendance rows, and a team must exist before it can be marked attending.
    SQLite runs in autocommit here (`isolation_level=None`), so each statement
    lands before the next reads it.
    """
    try:
        with _client() as client:
            event = _get(client, f"/event/{event_key}")
            roster = _get(client, f"/event/{event_key}/teams/simple")
            matches = _get(client, f"/event/{event_key}/matches/simple")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise TBANotFound(f"TBA has no event {event_key!r}") from e
        raise TBAError(f"TBA returned {e.response.status_code} for {event_key!r}") from e
    except httpx.HTTPError as e:
        raise TBAError(f"TBA request failed for {event_key!r}: {e}") from e

    with get_conn() as conn:
        _upsert_event(conn, event)

        team_numbers: list[int] = []
        for team in roster:
            n = _team_number(team.get("key", "")) or team.get("team_number")
            if n is None:
                continue
            _upsert_team(conn, n, team)
            team_numbers.append(n)

        conn.executemany(
            "INSERT OR IGNORE INTO event_teams (event_key, team_number) VALUES (?, ?)",
            [(event_key, n) for n in team_numbers],
        )

        for match in matches:
            _upsert_match(conn, match)

    summary = {
        "event_key": event_key,
        "event_name": event.get("name"),
        "teams": len(team_numbers),
        "matches": len(matches),
    }
    log.info("synced %s: %s teams, %s matches", event_key, summary["teams"], summary["matches"])
    return summary
