# Backend Foundation — Design Spec

Date: 2026-06-01
Branch: `backend/foundation`

## Context

The previous data pipeline (Supabase + Google Sheets, written to directly from the frontend) is being replaced with a single centralized Python API backed by SQLite. The frontend (React 19 + Vite, port 5173) is itself under rewrite, with four scouting interfaces planned:

- **Match** — quantitative match-time scouting
- **Subjective** — qualitative reviews
- **Pit** — pit scouting (per-robot, not per-match)
- **Break** — robot failure / break reports

Downstream, three consumer pages — Picklist (composite scoring), Robot (per-team detail), Strategy — currently read hardcoded mock data and will eventually call this backend.

**Scope of this work: foundation only.** We build enough that the frontend rewrite can submit data and read it back as raw lists. Composite scoring, aggregations, and analytics endpoints are deliberately left for students to implement later.

## Architecture

Single FastAPI app, stdlib `sqlite3` (no ORM), SQLite file at `backend/data/app.db`, no auth for now.

```
backend/
  app/
    main.py            # FastAPI app, CORS, router mounts
    config.py          # pydantic-settings: DB_PATH, CORS_ORIGINS, ENV
    db.py              # sqlite3 connection helper + init_db()
    schema.sql         # CREATE TABLE statements (single source of truth)
    models.py          # Pydantic models per submission type
    routers/
      health.py        # GET /api/health
      scouting.py      # POST /api/scouting/{match,subjective,pit,break}
      submissions.py   # GET /api/submissions, GET /api/submissions/{id}
      teams.py         # GET /api/teams/{n}/submissions
  data/                # gitignored
  scripts/
    init_db.py
  requirements.txt
  .env.example
  README.md
```

## DB schema

```sql
CREATE TABLE submissions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT    NOT NULL CHECK (type IN ('match','subjective','pit','break')),
  scout_name    TEXT    NOT NULL,
  event_key     TEXT,
  match_number  INTEGER,
  team_number   INTEGER NOT NULL,
  session_type  TEXT,
  data          TEXT    NOT NULL,          -- JSON blob, shape varies by type
  client_uuid   TEXT    UNIQUE,            -- frontend-generated idempotency key
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_submissions_team  ON submissions(team_number);
CREATE INDEX idx_submissions_match ON submissions(event_key, match_number);
CREATE INDEX idx_submissions_type  ON submissions(type);
```

`client_uuid` enables safe retries under flaky venue wifi: re-POST with the same uuid returns the original row instead of duplicating.

## API surface

### POST — typed Pydantic bodies, write to `submissions`

- `POST /api/scouting/match`
- `POST /api/scouting/subjective`
- `POST /api/scouting/pit`
- `POST /api/scouting/break`

Each body shares: `scout_name`, `event_key`, `match_number`, `team_number`, `session_type`, `client_uuid`, plus `data: dict[str, Any]` for type-specific fields (kept loose during the frontend rewrite — tighten later).

Responses:
- `201 Created` with `{id, created_at, ...}` on insert
- `200 OK` with the existing row on idempotent retry (same `client_uuid`, identical payload)
- `409 Conflict` if `client_uuid` collides with a different payload
- `422 Unprocessable Entity` on schema validation failure

### GET — raw lists, aggregations come later

- `GET /api/submissions?type=&team=&match=&event=&scout=&limit=&offset=` — paginated list
- `GET /api/submissions/{id}` — one row (404 if missing)
- `GET /api/teams/{team_number}/submissions` — convenience filter
- `GET /api/health` — `{status: "ok"}`

Picklist composite scoring, robot-page stat aggregates, and strategy joins are explicitly **not** built — they're presentation logic over these list endpoints and belong to the student implementation phase.

## Config

`.env` (gitignored), `.env.example` committed:

```
DB_PATH=./data/app.db
CORS_ORIGINS=http://localhost:5173
ENV=dev
```

## Commit stack

On branch `backend/foundation`:

1. `docs: add backend foundation design spec`  *(this file)*
2. `backend: add config, env example, gitignore for data dir`
3. `backend: add sqlite schema and db connection helper`
4. `backend: bootstrap FastAPI app with CORS and health route`
5. `backend: add pydantic models for the four submission types`
6. `backend: add scouting submit endpoints with idempotency`
7. `backend: add read endpoints for submissions and per-team list`
8. `backend: add README documenting setup, schema, endpoints, and run instructions`

## Verification

```bash
cd backend
pip install -r requirements.txt
python scripts/init_db.py
uvicorn app.main:app --reload
```

```bash
curl localhost:8000/api/health
# expect {"status":"ok"}

curl -X POST localhost:8000/api/scouting/match \
  -H 'Content-Type: application/json' \
  -d '{"scout_name":"test","team_number":1234,"match_number":1,"event_key":"2026miann","session_type":"Practice","client_uuid":"u1","data":{"auto_score":3}}'
# expect 201

# repeat — same uuid:
# expect 200 with same id

curl 'localhost:8000/api/submissions?team=1234'
# expect array containing the row
```

Visit `http://localhost:8000/docs` and confirm all four POSTs + GETs render with typed schemas.
