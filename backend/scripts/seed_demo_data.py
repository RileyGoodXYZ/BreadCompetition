"""Seed the database with realistic demo data so the alpha can be tested.

Populates all six tables for event 2026arc (Archimedes division): the team
roster and qual schedule are real (lifted from our scouting spreadsheet);
per-match scouting values are generated with a seeded RNG scaled by each
team's rank, so reruns are byte-identical and good teams look good.

Match submission `data` blobs mirror what the frontend actually POSTs
(frontend/src/pages/data-scout/Submit.jsx::buildPayload) key-for-key, so
every UI surface reads seeded rows exactly like live ones.

Run from the backend/ directory:
    python scripts/seed_demo_data.py            # idempotent — rerun is a no-op
    python scripts/seed_demo_data.py --reset    # drop seed-owned rows first
"""
import argparse
import json
import random
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import get_conn, init_db

SEED = 5940
EVENT_KEY = "2026arc"

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

# (team_number, name, qual_rank, shooter) — roster from the 2026arc sheet.
TEAMS = [
    (27, "Team RUSH", 7, "drum"),
    (103, "Cybersonics", 13, "fixed"),
    (131, "CHAOS", 46, "drum"),
    (167, "Children of the Corn", 49, "turret"),
    (548, "Robostangs", 36, "drum"),
    (587, "The Hedgehogs", 58, "fixed"),
    (971, "Spartan Robotics", 14, "turret"),
    (1114, "Simbotics", 3, "drum"),
    (1189, "Gearheads", 32, "fixed"),
    (1218, "SCH Robotics", 27, "turret"),
    (1241, "THEORY6", 5, "drum"),
    (1261, "Robo Lions Team1261", 19, "fixed"),
    (1501, "Team THRUST", 62, "turret"),
    (1511, "Rolling Thunder", 26, "fixed"),
    (1619, "Up-A-Creek Robotics", 20, "fixed"),
    (1646, "Precision Guessworks", 71, "fixed"),
    (1648, "G3 Robotics", 68, "turret"),
    (1731, "Fresta Valley Robotics Club", 60, "turret"),
    (1868, "Space Cookies", 23, "fixed"),
    (1912, "Team Combustion", 28, "drum"),
    (2075, "Enigma Robotics", 41, "turret"),
    (2106, "The Junkyard Dogs", 9, "turret"),
    (2137, "The Oxford RoboCats", 29, "turret"),
    (2539, "Krypton Cougars", 24, "drum"),
    (2583, "Orange Dynamite", 55, "drum"),
    (2767, "Stryke Force", 11, "turret"),
    (2826, "Wave Robotics", 47, "turret"),
    (2847, "The MegaHertz", 51, "fixed"),
    (2851, "Crevolution", 57, "drum"),
    (2881, "Lady Cans", 17, "turret"),
    (2960, "Automation Nation", 15, "fixed"),
    (3006, "Red Rock Robotics", 37, "turret"),
    (3045, "Gear Gremlins", 6, "drum"),
    (3284, "Camdenton LASER 3284", 34, "turret"),
    (3476, "Code Orange", 31, "drum"),
    (3494, "The Quadrangles", 44, "turret"),
    (3572, "Wavelength", 35, "turret"),
    (3604, "Goon Squad", 50, "turret"),
    (4096, "Ctrl-Z", 33, "fixed"),
    (4272, "Maverick Robotics", 40, "fixed"),
    (4403, "PrepaTec - ROULT - Penoles", 63, "drum"),
    (4593, "Rapid Acceleration", 43, "turret"),
    (4646, "Wildcard Robotics", 25, "turret"),
    (4728, "ROCORI Robotics", 67, "turret"),
    (5010, "Tiger Dynasty", 53, "turret"),
    (5066, "Singularity", 69, "turret"),
    (5338, "RoboLoCo", 65, "fixed"),
    (5468, "Chaos Theory", 10, "turret"),
    (5665, "FENERBAHCE DOGUS SPARC", 52, "drum"),
    (5801, "CTC Inspire", 56, "turret"),
    (5829, "Awtybots", 66, "fixed"),
    (5940, "BREAD", 1, "drum"),
    (6459, "AG Robotik", 48, "turret"),
    (6907, "The G.O.A.T", 22, "turret"),
    (7166, "Red Thunder Robotics", 12, "drum"),
    (7407, "Wired Boars", 30, "fixed"),
    (7525, "Pioneers", 59, "fixed"),
    (7598, "SCA Constellations", 61, "turret"),
    (8608, "Alpha Bots", 4, "turret"),
    (8817, "Buccaneer Robotics", 72, "fixed"),
    (8884, "Knight Owls", 21, "turret"),
    (9001, "Delta Force", 45, "fixed"),
    (9032, "RoboWhales", 16, "turret"),
    (9084, "Octobots", 39, "turret"),
    (9126, "Silver Hawks", 38, "turret"),
    (9401, "Midas' Mayhem", 18, "turret"),
    (9427, "iDeer", 54, "turret"),
    (9470, "Ctrl-Alt-Defeat", 2, "drum"),
    (9771, "FPRO", 74, "turret"),
    (10015, "Bubbles", 70, "fixed"),
    (10021, "Guerin Catholic Golden Gears", 8, "fixed"),
    (10162, "Viking Robotics", 75, "fixed"),
    (11019, "X.PLORE", 64, "turret"),
    (11297, "Iron Corsairs", 73, "fixed"),
    (11387, "G.L.E.A.M.", 42, "fixed"),
]

# "match: R1 R2 R3 | B1 B2 B3" — the real 2026arc qual schedule.
SCHEDULE_RAW = """
1: 9427 971 1912 | 5338 2583 2137
2: 167 2106 10021 | 1218 1241 2881
3: 7525 10015 6907 | 3604 4403 1619
4: 3494 11019 9470 | 11297 27 5066
5: 5940 1189 3476 | 587 8817 1646
6: 7166 9126 2767 | 9084 2826 548
7: 1261 10162 5801 | 1114 5665 4593
8: 1511 7598 5010 | 2075 5829 5468
9: 4646 131 1868 | 8884 3045 3006
10: 2960 4272 9032 | 1501 2851 11387
11: 4728 9001 1731 | 7407 2539 3284
12: 6459 4096 2847 | 8608 3572 9401
13: 103 1648 3604 | 9427 2106 9771
14: 3494 6907 1189 | 2583 2826 1241
15: 9470 2767 971 | 3476 4593 1218
16: 2137 9126 2881 | 5066 5010 8817
17: 131 11019 10015 | 1511 10021 5801
18: 1261 27 2960 | 7166 10162 5338
19: 4728 2075 1646 | 1912 3006 9032
20: 548 4646 1731 | 4096 8608 4272
21: 587 2847 1648 | 103 7525 3284
22: 9084 11297 9771 | 5940 5665 6459
23: 3045 7407 1114 | 3572 167 2851
24: 2539 1868 5468 | 5829 4403 1501
25: 8884 1619 11387 | 9001 9401 7598
26: 4593 2826 5338 | 10021 3604 8817
27: 2075 2137 10015 | 2881 3494 2767
28: 9032 7166 4096 | 5066 5801 1218
29: 4728 9470 8608 | 131 1189 5010
30: 1241 3476 1511 | 10162 4272 1648
31: 587 4646 2106 | 9084 1261 2851
32: 9427 5665 7525 | 27 5940 7407
33: 7598 548 4403 | 9001 971 11297
34: 1619 6459 2583 | 103 2960 5468
35: 11387 167 3045 | 1731 2539 2847
36: 1114 1912 6907 | 9401 8884 5829
37: 11019 3006 1501 | 9771 3572 9126
38: 3284 1868 3494 | 1646 2767 3604
39: 4096 2881 9084 | 1189 1511 1648
40: 2851 7166 8608 | 8817 4728 5665
41: 4646 9470 5940 | 7407 2075 10162
42: 5010 9427 1619 | 2826 4403 5801
43: 9001 1261 9032 | 5468 7525 167
44: 3045 9401 10021 | 971 5829 587
45: 9126 5338 3006 | 8884 2847 4272
46: 3476 131 11297 | 2106 1501 2583
47: 1646 9771 27 | 3572 1731 6907
48: 3284 2137 6459 | 11387 1114 1241
49: 11019 548 1868 | 10015 4593 103
50: 1218 2539 1912 | 7598 2960 5066
51: 8817 9001 3494 | 4646 9084 9427
52: 4403 9401 4728 | 2767 3045 5940
53: 1261 2847 1619 | 3604 9470 1189
54: 2881 3006 2075 | 5801 7525 2583
55: 5468 10021 131 | 4096 2851 11297
56: 971 9032 9126 | 27 1114 1511
57: 3476 5338 167 | 6907 103 8608
58: 548 1218 3572 | 1648 11387 1868
59: 5066 4593 5829 | 9771 4272 3284
60: 5665 1731 10015 | 1912 2960 2106
61: 10162 1501 2826 | 2137 587 7598
62: 6459 5010 8884 | 7407 7166 11019
63: 2539 1241 9401 | 5801 4646 1646
64: 2851 2583 2847 | 1511 9001 5940
65: 167 3604 9427 | 1189 9126 11297
66: 3572 8817 1261 | 971 1619 2075
67: 9032 2881 6907 | 131 548 3284
68: 10021 5665 27 | 3006 3476 11387
69: 8608 5468 3045 | 2960 4593 9771
70: 5829 1731 103 | 2767 2137 7525
71: 8884 2106 4096 | 3494 10162 4403
72: 1241 5066 9084 | 10015 7598 7407
73: 4272 1868 587 | 5010 1912 7166
74: 1501 1218 1114 | 11019 4728 5338
75: 2539 1648 1646 | 2826 6459 9470
76: 2851 3284 2075 | 9126 3476 9401
"""

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


def _parse_schedule() -> list[tuple[int, list[int], list[int]]]:
    matches = []
    for line in SCHEDULE_RAW.strip().splitlines():
        head, body = line.split(":")
        red_raw, blue_raw = body.split("|")
        matches.append((
            int(head),
            [int(n) for n in red_raw.split()],
            [int(n) for n in blue_raw.split()],
        ))
    return matches


def _tier(rank: int) -> float:
    """1.0 for the top seed, ~0.0 for the bottom seed."""
    return 1.0 - (rank - 1) / (len(TEAMS) - 1)


def _dumps(obj: dict[str, Any]) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def _build_match_data(rng: random.Random, tier: float, alliance: str, position: str) -> dict[str, Any]:
    no_show = rng.random() < 0.02

    if no_show:
        auto_pass = auto_score = score = pass_count = defense = herd = 0
        auto_climb = ""
        climbed = False
        climb_failed = False
    else:
        auto_pass = max(0, int(rng.gauss(1 + tier * 2, 1)))
        auto_score = max(0, int(rng.gauss(1 + tier * 5, 1.5)))
        auto_climb = rng.choice(["", "left", "middle", "right"])
        score = max(0, int(rng.gauss(8 + tier * 40, 6)))
        pass_count = max(0, int(rng.gauss(4 + tier * 12, 4)))
        defense = max(0, int(rng.gauss(6 - tier * 4, 3)))
        herd = max(0, int(rng.gauss(2 + tier * 4, 2)))
        climbed = rng.random() < (0.25 + tier * 0.6)
        climb_failed = not climbed and rng.random() < 0.2

    buttons = "\n".join(
        rng.choice(AUTO_BUTTON_KEYS) for _ in range(auto_pass + auto_score)
    )

    if climbed:
        level = rng.choices(["Level 1", "Level 2", "Level 3"],
                            weights=[1, 1 + tier * 2, 0.3 + tier * 4])[0]
        climb, result = level, "Successful"
        tower_position = rng.choice(["Center of Tower", "Side of Tower"])
    else:
        climb, level, tower_position = "None", "", ""
        result = "Failed" if climb_failed else "Not Attempted"

    good_auto = auto_score >= 1 + tier * 4
    review = rng.choice(
        (["Good Auto"] if good_auto else ["Bad Auto"])
        + (["Good Teleop"] if score >= 8 + tier * 30 else ["Bad Teleop"])
    )

    data = {
        "alliance": alliance,
        "position": position,
        "prematch_no_show": no_show,
        "review": review,
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
    }
    assert set(data) == MATCH_DATA_KEYS, "match data drifted from Submit.jsx"
    return data


def _insert_submission(conn, *, type_: str, scout: str, team: int, data: dict[str, Any],
                       match_number: int | None, client_uuid: str) -> None:
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


def seed_event(conn) -> None:
    data = {
        "code": "ARC",
        "shortName": "Archimedes",
        "location": "Houston, TX",
        "dates": "Apr 15 - Apr 18, 2026",
        "status": "Qualifications - Day 2",
    }
    conn.execute(
        """
        INSERT INTO events (event_key, name, data) VALUES (?, ?, ?)
        ON CONFLICT(event_key) DO UPDATE SET name = excluded.name, data = excluded.data,
          updated_at = datetime('now')
        """,
        (EVENT_KEY, "Archimedes Division", _dumps(data)),
    )


def seed_teams(conn, rng: random.Random) -> None:
    for number, name, rank, shooter in TEAMS:
        drivetrain = rng.choices(["swerve", "tank"], weights=[5, 1])[0]
        data = {
            # 5940 runs swerve; don't let the RNG say otherwise.
            "drivetrain": "swerve" if number == 5940 else drivetrain,
            "shooter": shooter,
            "rank": rank,
            "image_url": None,
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


def seed_pit_submissions(conn, rng: random.Random, tiers: dict[int, float]) -> None:
    for number, _, _, shooter in TEAMS:
        tier = tiers[number]
        data = {
            "autos": rng.choice(["score + climb", "3-ball score", "pass-heavy", "mobility only"]),
            "auto_climb": rng.random() < 0.3 + tier * 0.4,
            "climb_location": rng.choice(["center", "side", "either"]),
            "climb_ability": rng.choice(["Level 1", "Level 2", "Level 3", "none"]),
            "scoring_during_climb": rng.random() < 0.2,
            "buddy_climb": rng.random() < 0.15,
            "intake_location": rng.choice(["ground", "human player", "both"]),
            "throughput_bps": round(0.5 + tier * 2.5 + rng.random() * 0.5, 1),
            "passing_distance": rng.choice(["short", "mid", "full field"]),
            "hopper_size": rng.randint(2, 8),
            "shooter_type": shooter,
            "trench_bump": rng.choice(["trench", "bump", "both"]),
            "plays_defense": rng.random() < 0.4,
            "rebuilt": rng.random() < 0.25,
            "notes": rng.choice(SUBJECTIVE_NOTES),
            "robot_photo": None,
        }
        _insert_submission(
            conn, type_="pit", scout=SCOUTS[number % len(SCOUTS)], team=number,
            data=data, match_number=None, client_uuid=f"seed-pit-{EVENT_KEY}-t{number}",
        )


def seed_subjective_and_break(conn, rng: random.Random) -> None:
    for match_number, red, blue in _parse_schedule():
        for team in red + blue:
            if rng.random() < 0.25:
                data = {
                    "note": rng.choice(SUBJECTIVE_NOTES),
                    "drive_rating": rng.randint(1, 5),
                    "defense_rating": rng.randint(1, 5),
                }
                _insert_submission(
                    conn, type_="subjective", scout=SCOUTS[(match_number + team) % len(SCOUTS)],
                    team=team, data=data, match_number=match_number,
                    client_uuid=f"seed-subjective-{EVENT_KEY}-m{match_number}-t{team}",
                )
            if rng.random() < 0.03:
                data = {"description": rng.choice(BREAK_NOTES), "resolved": rng.random() < 0.7}
                _insert_submission(
                    conn, type_="break", scout=SCOUTS[(match_number * 3 + team) % len(SCOUTS)],
                    team=team, data=data, match_number=match_number,
                    client_uuid=f"seed-break-{EVENT_KEY}-m{match_number}-t{team}",
                )


def seed_picklists(conn) -> None:
    by_rank = sorted(TEAMS, key=lambda t: t[2])
    ranked_numbers = [str(t[0]) for t in by_rank]
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


def seed_strategies(conn) -> None:
    columns = [
        {"id": "auto", "label": "Auto"},
        {"id": "transition", "label": "Transition"},
        {"id": "shift1", "label": "Shift 1"},
        {"id": "shift2", "label": "Shift 2"},
        {"id": "shift3", "label": "Shift 3"},
        {"id": "endgame", "label": "Endgame"},
    ]
    matchups = [
        ("seed-strategy-qm5", "Quals 5 - vs 587 alliance", 5, "even",
         ["5940", "1189", "3476"], ["587", "8817", "1646"]),
        ("seed-strategy-qm32", "Quals 32 - vs 9427 alliance", 32, "us",
         ["27", "5940", "7407"], ["9427", "5665", "7525"]),
    ]
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
    conn.execute("DELETE FROM event_teams WHERE event_key = ?", (EVENT_KEY,))
    conn.execute("DELETE FROM events WHERE event_key = ?", (EVENT_KEY,))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reset", action="store_true",
                        help="delete seed-owned rows before reseeding")
    args = parser.parse_args()

    db_path = init_db()
    rng = random.Random(SEED)
    tiers = {number: _tier(rank) for number, _, rank, _ in TEAMS}

    with get_conn() as conn:
        if args.reset:
            reset(conn)
        seed_event(conn)
        seed_teams(conn, rng)
        seed_match_submissions(conn, rng, tiers)
        seed_pit_submissions(conn, rng, tiers)
        seed_subjective_and_break(conn, rng)
        seed_picklists(conn)
        seed_strategies(conn)

        for table in ("events", "teams", "event_teams", "submissions", "picklists", "strategies"):
            count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            print(f"{table}: {count}")
    print(f"seeded: {db_path}")


if __name__ == "__main__":
    main()
