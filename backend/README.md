# BreadCompetition Backend

A single FastAPI service backed by SQLite. Replaces the old Supabase + Google Sheets pipeline. The frontend (Vite, port 5173) submits scouting data here and reads it back through this API.

## What's built in this foundation

This is a foundation — enough to unblock the frontend rewrite and start collecting data. Composite scoring, per-team aggregates, and strategy joins are intentionally **not** built; they belong in a later phase.

Built:

- SQLite schema with a single `submissions` table holding all four scouting types
- Idempotent submit endpoints for **match**, **subjective**, **pit**, **break**
- Raw list / get-by-id read endpoints with filtering
- CORS configured for the dev frontend on `http://localhost:5173`
- `/docs` (OpenAPI) auto-generated for the frontend team

Not built (deferred to student implementation):

- Auth (no scout authentication or identity checking — `scout_name` is trusted as-is)
- Per-team aggregates (auto/teleop averages, climb rates, EPA, etc.)
- Picklist composite scoring endpoint
- Robot-page analytics endpoint (point breakdowns, match-by-match)
- Strategy-page joins (alliance EPA, opponent stats)
- CSV / Sheets export
- Tests

## Layout

```
backend/
  app/
    main.py            FastAPI app, CORS, router mounts
    config.py          pydantic-settings (DB_PATH, CORS_ORIGINS, ENV)
    db.py              sqlite3 connection helper + init_db()
    schema.sql         CREATE TABLE statements (single source of truth)
    models.py          Pydantic models per submission type
    routers/
      health.py        GET /api/health
      scouting.py      POST /api/scouting/{match,subjective,pit,break}
      submissions.py   GET /api/submissions, GET /api/submissions/{id}
      teams.py         GET /api/teams/{team_number}/submissions
  data/                gitignored — sqlite file lives here
  scripts/
    init_db.py         one-shot: create tables from schema.sql
  requirements.txt
  .env.example
  README.md
```

## Setup

Requires Python 3.10+.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python scripts/init_db.py
```

That creates `backend/data/app.db` with the schema applied.

## Run

```bash
uvicorn app.main:app --reload
```

- API root: `http://localhost:8000`
- Interactive docs (Swagger UI): `http://localhost:8000/docs`
- Alternative docs (ReDoc): `http://localhost:8000/redoc`

## Configuration

All via `backend/.env` (gitignored). See `.env.example` for the template.

| Variable | Default | Meaning |
|---|---|---|
| `DB_PATH` | `./data/app.db` | SQLite file path. Relative paths resolve against `backend/`. |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated list of allowed origins. |
| `ENV` | `dev` | Free-form env name. Reserved for future use. |

## Database

One table. All four scouting types live here, distinguished by the `type` column. Type-specific fields go in the `data` JSON blob, keeping the schema stable while the frontend forms evolve.

```sql
CREATE TABLE submissions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT    NOT NULL CHECK (type IN ('match','subjective','pit','break')),
  scout_name    TEXT    NOT NULL,
  event_key     TEXT,
  match_number  INTEGER,
  team_number   INTEGER NOT NULL,
  session_type  TEXT,
  data          TEXT    NOT NULL,          -- JSON blob
  client_uuid   TEXT    UNIQUE,            -- frontend-generated idempotency key
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

| Column | Meaning |
|---|---|
| `id` | Server-assigned row id. |
| `type` | One of `match`, `subjective`, `pit`, `break`. |
| `scout_name` | Who submitted. Currently trusted client-side. |
| `event_key` | Event identifier (e.g. `2026miann`). Nullable for off-event scouting. |
| `match_number` | Qualification / playoff match number. Null for pit scouting. |
| `team_number` | The team being scouted. |
| `session_type` | `Practice`, `Test`, `Rescout`, `Async`, `Official`, etc. Free-form. |
| `data` | JSON-encoded payload; shape depends on `type`. The API returns it decoded as an object. |
| `client_uuid` | UUID the frontend generates per submission for safe retries. Unique. |
| `created_at` | Server timestamp (`datetime('now')`, UTC). |

Indexes: `team_number`, `(event_key, match_number)`, `type`.

### Idempotency

Submitting the same `client_uuid` twice does **not** create two rows:

- Second POST with identical payload → `200 OK`, returns the existing row.
- Second POST with **different** payload → `409 Conflict`.

Frontend should generate a UUID per submission and resend the same UUID on retry. This is how we survive flaky venue wifi without dupes.

### Resetting the DB

```bash
rm backend/data/app.db
python scripts/init_db.py
```

## API

All routes are prefixed with `/api`. JSON in, JSON out.

### `GET /api/health`

```bash
curl localhost:8000/api/health
# {"status":"ok"}
```

### POST `/api/scouting/{type}`

Four endpoints, one per scouting type. Same body shape on all four — the type-specific fields go in `data`.

**Request body** (all fields):

| Field | Type | Required | Notes |
|---|---|---|---|
| `scout_name` | string | yes | Non-empty. |
| `team_number` | integer ≥ 0 | yes | |
| `event_key` | string | no | |
| `match_number` | integer ≥ 0 | no | Null for pit scouting. |
| `session_type` | string | no | |
| `client_uuid` | string | no (recommended) | Frontend-generated UUID for idempotent retries. |
| `data` | object | yes | Type-specific payload. Schema not enforced yet. |

**Responses:**

| Status | When |
|---|---|
| `201 Created` | New row inserted. Body is the stored row (with `data` decoded). |
| `200 OK` | Idempotent retry of identical body (same `client_uuid`). |
| `409 Conflict` | `client_uuid` already used with a different payload. |
| `422 Unprocessable Entity` | Body validation failed. |

**Match example:**

```bash
curl -X POST localhost:8000/api/scouting/match \
  -H 'Content-Type: application/json' \
  -d '{
    "scout_name": "lenna",
    "team_number": 1234,
    "match_number": 12,
    "event_key": "2026miann",
    "session_type": "Official",
    "client_uuid": "f1b3...",
    "data": {
      "auto_score": 5,
      "teleop_score": 18,
      "endgame_climb": "Level 2"
    }
  }'
```

**Subjective example:**

```bash
curl -X POST localhost:8000/api/scouting/subjective \
  -H 'Content-Type: application/json' \
  -d '{
    "scout_name": "sonia",
    "team_number": 1234,
    "match_number": 12,
    "event_key": "2026miann",
    "client_uuid": "9a02...",
    "data": {"review": "Good Auto", "notes": "fast cycles"}
  }'
```

**Pit example** (no `match_number`):

```bash
curl -X POST localhost:8000/api/scouting/pit \
  -H 'Content-Type: application/json' \
  -d '{
    "scout_name": "kylie",
    "team_number": 1234,
    "event_key": "2026miann",
    "client_uuid": "bb10...",
    "data": {"drivetrain": "swerve", "weight_lbs": 124, "intake": "ground"}
  }'
```

**Break example:**

```bash
curl -X POST localhost:8000/api/scouting/break \
  -H 'Content-Type: application/json' \
  -d '{
    "scout_name": "lenna",
    "team_number": 1234,
    "match_number": 15,
    "event_key": "2026miann",
    "client_uuid": "ccd2...",
    "data": {"failure": "battery disconnect", "time_lost_seconds": 30, "fixed": true}
  }'
```

### GET `/api/submissions`

Paginated list with optional filters. Newest first.

| Query param | Type | Default | Notes |
|---|---|---|---|
| `type` | `match`/`subjective`/`pit`/`break` | — | |
| `team` | int | — | `team_number` filter. |
| `match` | int | — | `match_number` filter. |
| `event` | string | — | `event_key` filter. |
| `scout` | string | — | `scout_name` filter (exact match). |
| `limit` | int (1–1000) | 100 | |
| `offset` | int ≥ 0 | 0 | |

```bash
curl 'localhost:8000/api/submissions?type=match&team=1234&event=2026miann&limit=50'
```

Returns a JSON array of submission rows (each with `data` decoded as an object).

### GET `/api/submissions/{id}`

Single submission by id. `404` if missing.

```bash
curl localhost:8000/api/submissions/42
```

### GET `/api/teams/{team_number}/submissions`

Convenience filter — same as `/api/submissions?team=...` but with the team in the URL. Accepts optional `type`, `limit`, `offset`.

```bash
curl 'localhost:8000/api/teams/1234/submissions?type=pit'
```

## Next steps for student implementation

The current read endpoints intentionally return raw rows. Pages like Picklist, Robot, and Strategy will need aggregated views. Suggested places to add them:

- **Per-team analytics** → new `app/routers/analytics.py`, e.g. `GET /api/teams/{n}/stats?event=...` returning auto/teleop/endgame averages computed from match submissions. Aggregations belong server-side once the SQL gets non-trivial.
- **Picklist composite scoring** → new `app/routers/picklist.py`, e.g. `GET /api/events/{event}/rankings` taking weighted-component query params and returning ranked teams.
- **Strategy** → endpoint that takes a list of team numbers and returns each team's summary in one round-trip.
- **Tighter Pydantic models** → once the frontend forms stabilize, replace `data: dict[str, Any]` in `app/models.py` with typed sub-models per scouting type to get 422 validation at the boundary.
- **Auth** → likely a simple shared-secret header or Google-OAuth-token-in-header check applied as a FastAPI dependency on the POST routes.
- **Tests** → no test suite yet. Consider pytest + httpx for the API and a temporary SQLite file per test.
