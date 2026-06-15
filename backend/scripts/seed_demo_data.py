"""Seed the database with real 2026arc data so the alpha can be tested.

Event metadata, the team roster, qual schedule, rankings, robot photos and
per-alliance scores come straight from The Blue Alliance; per-team EPA comes
from Statbotics (no key needed). Per-robot scouting form values are
synthesized to stay consistent with the real numbers: each alliance's real
fuel counts are split across its three robots proportional to their
Statbotics EPA components, and endgame climbs use TBA's real per-robot tower
results. Shooter types and pit build-quality scores come from the team's
"Backend 2026" scouting sheet (committed as scripts/fixtures/
sheet_2026arc.json). Fields with no real-world source (passes, herding,
remaining pit answers) are generated with per-entity seeded RNGs so reruns
are byte-identical.

Match submission `data` blobs mirror what the frontend actually POSTs
(frontend/src/pages/data-scout/Submit.jsx::buildPayload) key-for-key, so
every UI surface reads seeded rows exactly like live ones.

Raw API responses are cached under backend/data/api_cache/ so reruns are
fast and work offline; pass --refresh to re-fetch.

Requires TBA_API_KEY in backend/.env (free key: thebluealliance.com/account).

Run from the backend/ directory:
    python scripts/seed_demo_data.py            # idempotent — rerun is a no-op
    python scripts/seed_demo_data.py --reset    # drop seed-owned rows first
    python scripts/seed_demo_data.py --refresh  # ignore the API cache
"""
import argparse
import json
import random
import statistics
import sys
from pathlib import Path
from typing import Any, Optional

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.db import get_conn, init_db

SEED = 5940
EVENT_KEY = "2026arc"
YEAR = 2026

TBA_BASE = "https://www.thebluealliance.com/api/v3"
STATBOTICS_BASE = "https://api.statbotics.io/v3"
CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "api_cache"

# Real 2026arc data exported from the team's "Backend 2026" scouting sheet:
# shooter type per team plus advanced-pit build-quality scores. Committed as
# a fixture because the sheet itself isn't programmatically reachable here.
FIXTURE_PATH = Path(__file__).resolve().parent / "fixtures" / "sheet_2026arc.json"


def _load_sheet_fixture() -> dict[str, Any]:
    if not FIXTURE_PATH.exists():
        return {"shooters": {}, "pit_advanced": []}
    return json.loads(FIXTURE_PATH.read_text())


SHEET = _load_sheet_fixture()
SHEET_PIT_BY_TEAM = {p["team"]: p for p in SHEET["pit_advanced"]}

# Keep in sync with Submit.jsx::buildPayload — the seeder fails loudly if a
# generated blob drifts from what the real frontend submits.
MATCH_DATA_KEYS = {
    "alliance", "position", "prematch_no_show", "review",
    "auto_climb_selection", "auto_pass_count", "auto_score_count",
    "auto_pass_seconds", "auto_score_seconds", "auto_button_times",
    "climb", "endgame_result", "endgame_level", "endgame_tower_position",
    "shoot_while_climb", "buddy_climb", "score", "pass", "defense", "herd",
}

AUTO_BUTTON_KEYS = [
    "auto_human_player_count", "auto_depot_count",
    "auto_top_left_count", "auto_middle_left_count", "auto_bottom_left_count",
    "auto_top_right_count", "auto_middle_right_count", "auto_bottom_right_count",
]

SCOUTS = [
    "Avery Chen", "Jordan Patel", "Riley Nguyen", "Sam Okafor",
    "Casey Romero", "Morgan Lee", "Taylor Brooks", "Dana Kim",
]

SUBJECTIVE_NOTES = [
    "Fast cycles, rarely missed. Driver stayed calm under defense.",
    "Strong auto but slowed down late in the match.",
    "Played heavy defense, drew a foul in the last 30 seconds.",
    "Hopper jammed once mid-match, recovered quickly.",
    "Great herding — kept feeding their shooter all match.",
    "Climb looked shaky, took two attempts.",
    "Very consistent shooter, mostly mid-range.",
    "Sat in the trench lane most of teleop, limited impact.",
    "Buddy climb attempt failed but solo climb was clean.",
    "Aggressive intake, won most loose-ball scrambles.",
]

BREAK_NOTES = [
    "Shooter flywheel belt snapped mid-teleop, dead for ~40s.",
    "Intake arm bent after wall contact, could only herd.",
    "Lost comms for ~15s near the end of auto.",
    "Climber winch slipped, robot dropped at buzzer.",
]

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

# TBA breakdown says "Level1"; the scouting form says "Level 1".
TOWER_LEVELS = {"Level1": "Level 1", "Level2": "Level 2", "Level3": "Level 3"}


# --------------------------------------------------------------------------
# Fetch + cache
# --------------------------------------------------------------------------

def _fetch_json(url: str, headers: dict[str, str] | None = None) -> Any:
    resp = httpx.get(url, headers=headers, timeout=30, follow_redirects=True)
    resp.raise_for_status()
    return resp.json()


def _tba_get(path: str) -> Any:
    return _fetch_json(f"{TBA_BASE}{path}",
                       headers={"X-TBA-Auth-Key": settings.TBA_API_KEY})


def _fetch_statbotics_team_events() -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    offset = 0
    while True:
        page = _fetch_json(
            f"{STATBOTICS_BASE}/team_events?event={EVENT_KEY}&limit=250&offset={offset}"
        )
        out.extend(page)
        if len(page) < 250:
            return out
        offset += 250


def _cached(name: str, fetch, refresh: bool) -> Any:
    path = CACHE_DIR / f"{name}.json"
    if path.exists() and not refresh:
        return json.loads(path.read_text())
    data = fetch()
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=1))
    return data


# --------------------------------------------------------------------------
# Transform — raw API payloads → plain dicts the seeders consume
# --------------------------------------------------------------------------

def _team_number(team_key: str) -> int:
    return int(team_key.removeprefix("frc"))


def _pick_photo(media: list[dict[str, Any]]) -> str | None:
    photos = [m for m in media
              if m.get("type") in ("imgur", "instagram-image", "cdphotothread")
              and m.get("direct_url")]
    if not photos:
        return None
    preferred = [m for m in photos if m.get("preferred")]
    return (preferred or photos)[0]["direct_url"]


def _fmt_dates(start: str, end: str) -> str:
    sy, sm, sd = (int(x) for x in start.split("-"))
    ey, em, ed = (int(x) for x in end.split("-"))
    return f"{MONTHS[sm - 1]} {sd} - {MONTHS[em - 1]} {ed}, {ey}"


def load_real_data(refresh: bool) -> dict[str, Any]:
    """Fetch (or read from cache) everything the seeders need."""
    event = _cached("tba_event", lambda: _tba_get(f"/event/{EVENT_KEY}"), refresh)
    roster_raw = _cached("tba_event_teams",
                         lambda: _tba_get(f"/event/{EVENT_KEY}/teams/simple"), refresh)
    matches_raw = _cached("tba_event_matches",
                          lambda: _tba_get(f"/event/{EVENT_KEY}/matches"), refresh)
    rankings_raw = _cached("tba_event_rankings",
                           lambda: _tba_get(f"/event/{EVENT_KEY}/rankings"), refresh)
    statbotics_raw = _cached("statbotics_team_events",
                             _fetch_statbotics_team_events, refresh)

    teams = {t["team_number"]: t["nickname"] for t in roster_raw}
    if not teams:
        sys.exit(f"TBA returned no teams for {EVENT_KEY} — check the event key.")

    quals = []
    skipped = 0
    for m in sorted(matches_raw, key=lambda m: m["match_number"]):
        if m["comp_level"] != "qm":
            continue
        breakdown = m.get("score_breakdown")
        if not breakdown or m["alliances"]["red"]["score"] in (None, -1):
            skipped += 1
            continue
        quals.append({
            "match_number": m["match_number"],
            "alliances": {
                "Red": {
                    "teams": [_team_number(k) for k in m["alliances"]["red"]["team_keys"]],
                    "score": m["alliances"]["red"]["score"],
                    "breakdown": breakdown["red"],
                },
                "Blue": {
                    "teams": [_team_number(k) for k in m["alliances"]["blue"]["team_keys"]],
                    "score": m["alliances"]["blue"]["score"],
                    "breakdown": breakdown["blue"],
                },
            },
        })
    if not quals:
        sys.exit(f"TBA returned no played qual matches for {EVENT_KEY}.")
    if skipped:
        print(f"skipped {skipped} unplayed qual matches")

    epas: dict[int, dict[str, float]] = {}
    for te in statbotics_raw:
        br = (te.get("epa") or {}).get("breakdown") or {}
        total = br.get("total_points")
        if total is None:
            total = ((te.get("epa") or {}).get("total_points") or {}).get("mean")
        if total is None:
            continue
        epas[te["team"]] = {
            "total": float(total),
            "auto": float(br.get("auto_points") or 0.0),
            "teleop": float(br.get("teleop_points") or 0.0),
            "endgame": float(br.get("endgame_points") or 0.0),
        }
    missing_epa = sorted(set(teams) - set(epas))
    if missing_epa:
        median = statistics.median(e["total"] for e in epas.values()) if epas else 100.0
        for number in missing_epa:
            epas[number] = {"total": median, "auto": median * 0.2,
                            "teleop": median * 0.65, "endgame": median * 0.15}
        print(f"no Statbotics EPA for {missing_epa} — using event median")

    ranks = {_team_number(r["team_key"]): r["rank"]
             for r in (rankings_raw or {}).get("rankings", [])}
    if not ranks:
        print("TBA rankings empty — ranking by EPA instead")
        by_epa = sorted(teams, key=lambda n: -epas[n]["total"])
        ranks = {number: i + 1 for i, number in enumerate(by_epa)}

    photos = {}
    for number in teams:
        media = _cached(f"tba_media_frc{number}",
                        lambda n=number: _tba_get(f"/team/frc{n}/media/{YEAR}"), refresh)
        photos[number] = _pick_photo(media)

    return {"event": event, "teams": teams, "quals": quals,
            "ranks": ranks, "epas": epas, "photos": photos}


def _epa_percentiles(epas: dict[int, dict[str, float]]) -> dict[int, float]:
    """0.0 for the weakest team at the event, 1.0 for the strongest."""
    ordered = sorted(epas, key=lambda n: epas[n]["total"])
    if len(ordered) == 1:
        return {ordered[0]: 1.0}
    return {n: i / (len(ordered) - 1) for i, n in enumerate(ordered)}


# --------------------------------------------------------------------------
# Calibration — split real alliance totals across the three robots
# --------------------------------------------------------------------------

def _split_count(total: int, weights: list[float], rng: random.Random) -> list[int]:
    """Integer parts proportional to noisy weights, summing exactly to total."""
    noisy = [max(0.5, w) * rng.uniform(0.85, 1.15) for w in weights]
    scale = sum(noisy)
    raw = [total * w / scale for w in noisy]
    parts = [int(r) for r in raw]
    remainders = sorted(range(len(raw)), key=lambda i: raw[i] - parts[i], reverse=True)
    for i in range(total - sum(parts)):
        parts[remainders[i % len(parts)]] += 1
    return parts


def _build_robot_rows(quals: list[dict[str, Any]],
                      epas: dict[int, dict[str, float]],
                      percentiles: dict[int, float]) -> list[dict[str, Any]]:
    """One row per robot per qual match, with everything except `review`
    (which needs event-wide medians, filled in by the caller)."""
    rows = []
    for match in quals:
        for alliance, side in match["alliances"].items():
            breakdown = side["breakdown"]
            hub = breakdown.get("hubScore") or {}
            lineup = side["teams"]
            split_rng = random.Random(f"{SEED}-m{match['match_number']}-{alliance}")
            auto_w = [epas.get(t, {}).get("auto", 1.0) for t in lineup]
            teleop_w = [epas.get(t, {}).get("teleop", 1.0)
                        + epas.get(t, {}).get("endgame", 0.0) for t in lineup]
            auto_counts = _split_count(int(hub.get("autoCount") or 0), auto_w, split_rng)
            teleop_counts = _split_count(int(hub.get("teleopCount") or 0), teleop_w, split_rng)

            for idx, team in enumerate(lineup):
                rng = random.Random(f"{SEED}-m{match['match_number']}-t{team}")
                pct = percentiles.get(team, 0.5)
                auto_score = auto_counts[idx]
                score = teleop_counts[idx]

                # Real per-robot tower results straight from the TBA breakdown.
                auto_tower = breakdown.get(f"autoTowerRobot{idx + 1}", "None")
                endgame_tower = breakdown.get(f"endGameTowerRobot{idx + 1}", "None")
                auto_climb = rng.choice(["left", "middle", "right"]) \
                    if auto_tower in TOWER_LEVELS else ""
                if endgame_tower in TOWER_LEVELS:
                    climb = level = TOWER_LEVELS[endgame_tower]
                    result = "Successful"
                    tower_position = rng.choice(["Center of Tower", "Side of Tower"])
                else:
                    climb, level, tower_position = "None", "", ""
                    result = "Failed" if rng.random() < 0.2 else "Not Attempted"
                climbed = result == "Successful"

                # No real source for these — scale plausible values by EPA.
                auto_pass = max(0, int(rng.gauss(pct * 2, 1)))
                pass_count = max(0, int(rng.gauss(2 + pct * 10, 3)))
                defense = max(0, int(rng.gauss(6 - pct * 5, 2)))
                herd = max(0, int(rng.gauss(2 + pct * 4, 2)))
                buttons = "\n".join(
                    rng.choice(AUTO_BUTTON_KEYS) for _ in range(min(auto_pass + auto_score, 40))
                )

                rows.append({
                    "match_number": match["match_number"],
                    "team": team,
                    "data": {
                        "alliance": alliance,
                        "position": str(idx + 1),
                        "prematch_no_show": False,
                        "review": "",  # filled once event medians are known
                        "auto_climb_selection": auto_climb,
                        "auto_pass_count": auto_pass,
                        "auto_score_count": auto_score,
                        "auto_pass_seconds": rng.randint(2, 12) if auto_pass else 0,
                        "auto_score_seconds": rng.randint(2, 14) if auto_score else 0,
                        "auto_button_times": buttons,
                        "climb": climb,
                        "endgame_result": result,
                        "endgame_level": level,
                        "endgame_tower_position": tower_position,
                        "shoot_while_climb": climbed and rng.random() < 0.15,
                        "buddy_climb": climbed and rng.random() < 0.08,
                        "score": score,
                        "pass": pass_count,
                        "defense": defense,
                        "herd": herd,
                    },
                })

    auto_median = statistics.median(r["data"]["auto_score_count"] for r in rows)
    teleop_median = statistics.median(r["data"]["score"] for r in rows)
    for row in rows:
        rng = random.Random(f"{SEED}-review-m{row['match_number']}-t{row['team']}")
        data = row["data"]
        data["review"] = rng.choice(
            (["Good Auto"] if data["auto_score_count"] >= auto_median else ["Bad Auto"])
            + (["Good Teleop"] if data["score"] >= teleop_median else ["Bad Teleop"])
        )
        assert set(data) == MATCH_DATA_KEYS, "match data drifted from Submit.jsx"
    return rows


def _best_climbs(quals: list[dict[str, Any]]) -> dict[int, str]:
    """Each team's best real endgame climb across quals, for pit answers."""
    order = {"none": 0, "Level 1": 1, "Level 2": 2, "Level 3": 3}
    best: dict[int, str] = {}
    for match in quals:
        for side in match["alliances"].values():
            for idx, team in enumerate(side["teams"]):
                level = TOWER_LEVELS.get(
                    side["breakdown"].get(f"endGameTowerRobot{idx + 1}", "None"), "none")
                if order[level] > order.get(best.get(team, "none"), 0):
                    best[team] = level
    return best


# --------------------------------------------------------------------------
# Insert
# --------------------------------------------------------------------------

def _dumps(obj: dict[str, Any]) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def _insert_submission(conn, *, type_: str, scout: str, team: int, data: dict[str, Any],
                       match_number: Optional[int], client_uuid: str) -> None:
    conn.execute(
        """
        INSERT INTO submissions
          (type, scout_name, event_key, match_number, team_number, session_type, data, client_uuid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(client_uuid) DO NOTHING
        """,
        (type_, scout, EVENT_KEY, match_number, team,
         "qm" if match_number else None, _dumps(data), client_uuid),
    )


def seed_event(conn, event: dict[str, Any]) -> None:
    data = {
        "code": (event.get("event_code") or "").upper(),
        "shortName": event.get("short_name") or event.get("name"),
        "location": f"{event.get('city')}, {event.get('state_prov')}",
        "dates": _fmt_dates(event["start_date"], event["end_date"]),
        "status": "Event Complete",
    }
    conn.execute(
        """
        INSERT INTO events (event_key, name, data) VALUES (?, ?, ?)
        ON CONFLICT(event_key) DO UPDATE SET name = excluded.name, data = excluded.data,
          updated_at = datetime('now')
        """,
        (EVENT_KEY, event["name"], _dumps(data)),
    )


def _team_traits(number: int) -> dict[str, str]:
    """Drivetrain has no real data source — stable per-team RNG. Shooter
    comes from the scouting-sheet fixture when the team was pit-scouted."""
    rng = random.Random(f"{SEED}-team-{number}")
    drivetrain = rng.choices(["swerve", "tank"], weights=[5, 1])[0]
    return {
        # 5940 runs swerve; don't let the RNG say otherwise.
        "drivetrain": "swerve" if number == 5940 else drivetrain,
        "shooter": SHEET["shooters"].get(str(number))
        or rng.choice(["drum", "fixed", "turret"]),
    }


def seed_teams(conn, real: dict[str, Any]) -> None:
    for number, name in real["teams"].items():
        data = {
            **_team_traits(number),
            "rank": real["ranks"].get(number),
            "image_url": real["photos"].get(number),
            "epa": round(real["epas"][number]["total"], 1),
        }
        conn.execute(
            """
            INSERT INTO teams (team_number, name, data) VALUES (?, ?, ?)
            ON CONFLICT(team_number) DO UPDATE SET name = excluded.name, data = excluded.data,
              updated_at = datetime('now')
            """,
            (number, name, _dumps(data)),
        )
        conn.execute(
            "INSERT INTO event_teams (event_key, team_number) VALUES (?, ?) "
            "ON CONFLICT DO NOTHING",
            (EVENT_KEY, number),
        )


def seed_matches(conn) -> None:
    """Seed the qual schedule into the `matches` table.

    The UI renders scheduledAt / startsInLabel / field as opaque strings; we
    don't have real timestamps yet, so synthesize plausible display text from
    the match number (matches roughly 12 min apart, starting 9:00 AM).
    """
    for match_number, red, blue in _parse_schedule():
        total_minutes = 9 * 60 + (match_number - 1) * 12
        hour_24 = (total_minutes // 60) % 24
        minute = total_minutes % 60
        am_pm = "AM" if hour_24 < 12 else "PM"
        hour_12 = ((hour_24 + 11) % 12) + 1
        scheduled_at = f"{hour_12}:{minute:02d} {am_pm}"
        starts_in = "live" if match_number == 1 else f"+{(match_number - 1) * 12} min"

        data = {
            "scheduledAt": scheduled_at,
            "startsInLabel": starts_in,
            "field": "Archimedes",
        }
        conn.execute(
            """
            INSERT INTO matches (event_key, comp_level, match_number,
                                 red_alliance, blue_alliance, data)
            VALUES (?, 'qm', ?, ?, ?, ?)
            ON CONFLICT(event_key, comp_level, match_number) DO UPDATE SET
              red_alliance  = excluded.red_alliance,
              blue_alliance = excluded.blue_alliance,
              data          = excluded.data,
              updated_at    = datetime('now')
            """,
            (EVENT_KEY, match_number, _dumps(red), _dumps(blue), _dumps(data)),
        )


def seed_match_submissions(conn, rng: random.Random, tiers: dict[int, float]) -> None:
    for match_number, red, blue in _parse_schedule():
        for alliance, lineup in (("Red", red), ("Blue", blue)):
            for idx, team in enumerate(lineup):
                scout = SCOUTS[(match_number * 6 + idx) % len(SCOUTS)]
                data = _build_match_data(rng, tiers[team], alliance, str(idx + 1))
                _insert_submission(
                    conn, type_="match", scout=scout, team=team, data=data,
                    match_number=match_number,
                    client_uuid=f"seed-match-{EVENT_KEY}-m{match_number}-t{team}",
                )


def seed_pit_submissions(conn, real: dict[str, Any],
                         percentiles: dict[int, float],
                         best_climbs: dict[int, str]) -> None:
    for number in real["teams"]:
        rng = random.Random(f"{SEED}-pit-{number}")
        pct = percentiles.get(number, 0.5)
        # Pit answers have no real data source, but stay consistent with what
        # actually happened on the field where we can (climb, photo, shooter).
        data = {
            "autos": rng.choice(["score + climb", "3-ball score", "pass-heavy", "mobility only"]),
            "auto_climb": rng.random() < 0.3 + pct * 0.4,
            "climb_location": rng.choice(["center", "side", "either"]),
            "climb_ability": best_climbs.get(number, "none"),
            "scoring_during_climb": rng.random() < 0.2,
            "buddy_climb": rng.random() < 0.15,
            "intake_location": rng.choice(["ground", "human player", "both"]),
            "throughput_bps": round(0.5 + pct * 2.5 + rng.random() * 0.5, 1),
            "passing_distance": rng.choice(["short", "mid", "full field"]),
            "hopper_size": rng.randint(2, 8),
            "shooter_type": _team_traits(number)["shooter"],
            "trench_bump": rng.choice(["trench", "bump", "both"]),
            "plays_defense": rng.random() < 0.4,
            "rebuilt": rng.random() < 0.25,
            "notes": rng.choice(SUBJECTIVE_NOTES),
            "robot_photo": real["photos"].get(number),
        }
        # Overlay the real advanced-pit row from the scouting sheet: build
        # quality scores always, prose notes when the scouts wrote any.
        sheet_pit = SHEET_PIT_BY_TEAM.get(number)
        if sheet_pit:
            data["mech_score"] = sheet_pit["mech_score"]
            data["electrical_score"] = sheet_pit["electrical_score"]
            data["bumper_score"] = sheet_pit["bumper_score"]
            if sheet_pit["notes"]:
                data["notes"] = sheet_pit["notes"]
        _insert_submission(
            conn, type_="pit", scout=SCOUTS[number % len(SCOUTS)], team=number,
            data=data, match_number=None, client_uuid=f"seed-pit-{EVENT_KEY}-t{number}",
        )


def seed_subjective_and_break(conn, quals: list[dict[str, Any]],
                              percentiles: dict[int, float]) -> None:
    for match in quals:
        match_number = match["match_number"]
        for side in match["alliances"].values():
            for team in side["teams"]:
                rng = random.Random(f"{SEED}-subj-m{match_number}-t{team}")
                pct = percentiles.get(team, 0.5)
                if rng.random() < 0.25:
                    data = {
                        "note": rng.choice(SUBJECTIVE_NOTES),
                        "drive_rating": min(5, max(1, round(1 + pct * 4 + rng.uniform(-0.6, 0.6)))),
                        "defense_rating": rng.randint(1, 5),
                    }
                    _insert_submission(
                        conn, type_="subjective",
                        scout=SCOUTS[(match_number + team) % len(SCOUTS)],
                        team=team, data=data, match_number=match_number,
                        client_uuid=f"seed-subjective-{EVENT_KEY}-m{match_number}-t{team}",
                    )
                if rng.random() < 0.03:
                    data = {"description": rng.choice(BREAK_NOTES),
                            "resolved": rng.random() < 0.7}
                    _insert_submission(
                        conn, type_="break",
                        scout=SCOUTS[(match_number * 3 + team) % len(SCOUTS)],
                        team=team, data=data, match_number=match_number,
                        client_uuid=f"seed-break-{EVENT_KEY}-m{match_number}-t{team}",
                    )


def seed_picklists(conn, real: dict[str, Any]) -> None:
    ranked_numbers = [str(n) for n in
                      sorted(real["teams"], key=lambda n: real["ranks"].get(n, 999))]
    rows = [
        ("seed-picklist-shared", "ARC Quals - Shared Picklist", "shared", "BREAD Strategy", 1,
         {"slots": ranked_numbers[1:4], "rowNotes": {}, "rankings": ranked_numbers[:25], "locked": False}),
        ("seed-picklist-my", "My Draft List", "my", "Maxwell Li", 0,
         {"slots": [None, None, None], "rowNotes": {}, "rankings": ranked_numbers[:10], "locked": False}),
    ]
    for id_, title, kind, owner, starred, data in rows:
        conn.execute(
            """
            INSERT INTO picklists (id, title, event_key, kind, owner, starred, archived, data)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?)
            ON CONFLICT(id) DO UPDATE SET title = excluded.title, data = excluded.data,
              updated_at = datetime('now')
            """,
            (id_, title, EVENT_KEY, kind, owner, starred, _dumps(data)),
        )


def seed_strategies(conn, real: dict[str, Any]) -> None:
    columns = [
        {"id": "auto", "label": "Auto"},
        {"id": "transition", "label": "Transition"},
        {"id": "shift1", "label": "Shift 1"},
        {"id": "shift2", "label": "Shift 2"},
        {"id": "shift3", "label": "Shift 3"},
        {"id": "endgame", "label": "Endgame"},
    ]
    our_matches = [m for m in real["quals"]
                   if any(5940 in side["teams"] for side in m["alliances"].values())]
    matchups = []
    for match in (our_matches or real["quals"])[:2]:
        n = match["match_number"]
        sides = match["alliances"]
        ours_side = "Red" if 5940 in sides["Red"]["teams"] else "Blue"
        theirs_side = "Blue" if ours_side == "Red" else "Red"
        ours = [str(t) for t in sides[ours_side]["teams"]]
        theirs = [str(t) for t in sides[theirs_side]["teams"]]
        our_epa = sum(real["epas"][t]["total"] for t in sides[ours_side]["teams"])
        their_epa = sum(real["epas"][t]["total"] for t in sides[theirs_side]["teams"])
        favored = "us" if our_epa > their_epa * 1.1 else \
                  "them" if their_epa > our_epa * 1.1 else "even"
        matchups.append((f"seed-strategy-qm{n}", f"Quals {n} - vs {theirs[0]} alliance",
                         n, favored, ours, theirs))

    for id_, title, match_number, favored, ours, theirs in matchups:
        scenarios = [
            {"id": f"{id_}-win-auto", "title": "Win Auto", "tone": "ours", "teams": ours,
             "cells": {ours[0]: {"auto": "3-ball + climb", "endgame": "Level 3"}}},
            {"id": f"{id_}-lose-auto", "title": "Lose Auto", "tone": "ours", "teams": ours,
             "cells": {ours[1]: {"shift1": "herd to shooter"}}},
            {"id": f"{id_}-opponent", "title": "Opponent Strategy", "tone": "opponent",
             "teams": theirs, "cells": {}},
        ]
        data = {
            "ourAlliance": ours,
            "opponentAlliance": theirs,
            "scenarios": scenarios,
            "columns": columns,
        }
        conn.execute(
            """
            INSERT INTO strategies (id, title, event_key, match_number, favored, data)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET title = excluded.title, data = excluded.data,
              updated_at = datetime('now')
            """,
            (id_, title, EVENT_KEY, match_number, favored, _dumps(data)),
        )


def reset(conn) -> None:
    conn.execute("DELETE FROM submissions WHERE client_uuid LIKE 'seed-%'")
    conn.execute("DELETE FROM picklists WHERE id LIKE 'seed-%'")
    conn.execute("DELETE FROM strategies WHERE id LIKE 'seed-%'")
    conn.execute("DELETE FROM matches WHERE event_key = ?", (EVENT_KEY,))
    conn.execute("DELETE FROM event_teams WHERE event_key = ?", (EVENT_KEY,))
    conn.execute("DELETE FROM events WHERE event_key = ?", (EVENT_KEY,))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reset", action="store_true",
                        help="delete seed-owned rows before reseeding")
    parser.add_argument("--refresh", action="store_true",
                        help="ignore cached API responses and re-fetch")
    args = parser.parse_args()

    if not settings.TBA_API_KEY:
        sys.exit("TBA_API_KEY is not set. Get a free key at "
                 "https://www.thebluealliance.com/account and add "
                 "TBA_API_KEY=... to backend/.env")

    try:
        real = load_real_data(args.refresh)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 401:
            sys.exit("TBA rejected the API key — check TBA_API_KEY in backend/.env")
        sys.exit(f"API request failed: {exc}")

    percentiles = _epa_percentiles(real["epas"])
    rows = _build_robot_rows(real["quals"], real["epas"], percentiles)
    climbs = _best_climbs(real["quals"])

    db_path = init_db()
    with get_conn() as conn:
        if args.reset:
            reset(conn)
        seed_event(conn)
        seed_teams(conn, rng)
        seed_matches(conn)
        seed_match_submissions(conn, rng, tiers)
        seed_pit_submissions(conn, rng, tiers)
        seed_subjective_and_break(conn, rng)
        seed_picklists(conn)
        seed_strategies(conn)

        for table in ("events", "teams", "event_teams", "matches", "submissions", "picklists", "strategies"):
            count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            print(f"{table}: {count}")

    photos = sum(1 for url in real["photos"].values() if url)
    print(f"quals: {len(real['quals'])}, teams: {len(real['teams'])}, "
          f"photos: {photos}/{len(real['teams'])}")
    print(f"sheet fixture: {len(SHEET['shooters'])} shooters, "
          f"{len(SHEET['pit_advanced'])} advanced-pit rows")
    print(f"seeded: {db_path}")


if __name__ == "__main__":
    main()
