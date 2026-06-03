# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

After every code change, you MUST:
1. If backend Python files changed, run `cd backend && .venv/bin/python -c "from app.main import app; print('ok')"` to verify the app still imports
2. If frontend files changed, run `cd frontend && npm run build` to verify the build
3. If `backend/app/schema.sql` changed, delete `backend/data/app.db` so the new schema gets re-applied on next startup

Fix any errors before reporting the task as complete.

## What This Is

BreadCompetition is FRC scouting software for team 5940. It collects match / pit / subjective / break scouting forms, organizes them by team and event, and surfaces them through picklist, robot-data, and match-strategy views used during competitions.

Monorepo: React 19 + Vite frontend (port 5173) calling a FastAPI + SQLite backend (port 8000). Replaces an older Supabase + Google Sheets pipeline.

## Commands

### Backend (FastAPI + SQLite)
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # one-time
pip install -r requirements.txt                       # one-time
cp .env.example .env                                  # one-time
python scripts/init_db.py                             # apply schema → data/app.db

uvicorn app.main:app --reload                         # run on :8000
```

API docs at `http://localhost:8000/docs` (Swagger) or `/redoc`.

### Frontend (Vite)
```bash
cd frontend
npm install                                           # one-time
npm run dev                                           # dev server on :5173
npm run dev -- --host                                 # expose to LAN for mobile testing
npm run build                                         # production build
npm run lint                                          # eslint
```

### Reset local database
```bash
rm backend/data/app.db && cd backend && python scripts/init_db.py
```

Do this whenever `schema.sql` changes — SQLite doesn't ALTER CHECK constraints and the schema is `CREATE TABLE IF NOT EXISTS`, so an existing db won't pick up new tables or columns.

## Architecture

The `scouting-architecture` skill (`.claude/skills/scouting-architecture/SKILL.md`) covers the backend in depth — table model, router conventions, frontend integration plan, and anti-patterns. Read it before extending the API. Short version below.

### Backend layers
1. **Raw scouting writes** — `POST /api/scouting/{match|subjective|pit|break}` lands in one polymorphic `submissions` table with a JSON `data` blob and `client_uuid` idempotency.
2. **Resource CRUD** — `teams`, `events`, `event_teams`, `picklists`, `strategies` tables, each with a thin router that exposes list/get/create/update/delete. UI-owned document shapes live in JSON `data` columns; only filterable fields are real columns.
3. **Aggregation (not built)** — analytics, rankings, EPA, BPS. These will read from `submissions` and probably live in `app/services/` to keep routers thin. The picklist/robot-data/strategy pages currently render mock data and will switch over once these endpoints exist.

### Database — six tables
```
events ──┐
         ▼
event_teams ──► teams ◄── submissions  (team_number, no FK)
                              ▲
                              │ aggregation queries (future)
                              │
picklists, strategies (free-standing JSON documents, reference event_key/team
numbers by convention)
```

| Table | Purpose |
|---|---|
| `submissions` | Raw scouting forms (4 types, JSON body) |
| `teams` | Global team catalog (name, drivetrain, image) |
| `events` | Competition metadata (`event_key` mirrors TBA) |
| `event_teams` | Attendance join (which teams at which event) |
| `picklists` | Picklist documents (Library + Manager pages) |
| `strategies` | Match-strategy documents (Library + Detail pages) |

### Router conventions
Every router file in `app/routers/` follows the same shape:
- `router = APIRouter(prefix="/api/<resource>", tags=["<resource>"])` at module top
- `_row_to_dict(row)` helper that JSON-decodes the `data` column and coerces SQLite booleans
- `with get_conn() as conn:` for every DB access — never module-level connections
- Parameterized SQL always (build `clauses: list[str]` + `params: list[Any]`, join with `AND`)
- Standard verb mapping: `GET` list/one, `POST` create (201), `PATCH` partial update (`model_dump(exclude_unset=True)`), `PUT` idempotent upsert (admin/seed only), `DELETE` (204)
- Errors via `HTTPException(status_code=status.HTTP_*, detail=...)` — never return error dicts
- List endpoints take `limit` / `offset` with sane bounds (default 100, max 1000)
- PATCH replaces `data` wholesale; no deep merge

### Threading / concurrency
- FastAPI runs synchronous handlers; SQLite in WAL mode with `check_same_thread=False`
- `get_conn()` is a context manager — connection opens and closes per request
- No background workers, no async jobs yet — when they appear, put them under `app/services/`

## Key files

| Path | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI app, CORS, router registration |
| `backend/app/config.py` | Settings via pydantic-settings (`DB_PATH`, `CORS_ORIGINS`) |
| `backend/app/db.py` | `get_conn()` context manager, `init_db()` |
| `backend/app/schema.sql` | All `CREATE TABLE` / `CREATE INDEX` (idempotent) |
| `backend/app/models.py` | All Pydantic models, one section per resource |
| `backend/app/routers/scouting.py` | `POST /api/scouting/{match,subjective,pit,break}` (polymorphic, idempotent) |
| `backend/app/routers/submissions.py` | Raw submission reads with filters |
| `backend/app/routers/teams.py` | Global team catalog + per-team submissions view |
| `backend/app/routers/events.py` | Event metadata + attendance roster + matches stub |
| `backend/app/routers/picklists.py` | Picklist CRUD (Library + Manager pages) |
| `backend/app/routers/strategies.py` | Strategy CRUD (Library + Detail pages) |
| `backend/scripts/init_db.py` | Re-apply `schema.sql` to `data/app.db` |
| `frontend/src/pages/data-scout/` | Scouting form pages (Auto, Teleop, Endgame, Prematch, Profile, Submit) |
| `frontend/src/pages/picklist/` | Library, Manager, RobotData |
| `frontend/src/pages/match-strategy/` | Library, Detail |
| `frontend/src/lib/picklists-store.jsx` | In-memory picklist state (to be replaced by `/api/picklists`) |
| `frontend/src/lib/match-strategy-store.jsx` | In-memory strategy state (to be replaced by `/api/strategies`) |
| `frontend/src/lib/schedule.js` | Mock event + matches (to be replaced by `/api/events` and `/api/events/{key}/matches`) |
| `frontend/src/components/Shell.jsx` | App shell (Sidebar + TopBar wrapper) |
| `.claude/skills/scouting-architecture/SKILL.md` | Full architecture skill — read before extending the API |

## Anti-patterns

- **Don't put route logic in `main.py`** — only registration.
- **Don't create a new router per submission type** — extend `scouting.py`; the table is polymorphic.
- **Don't add a column for every new UI field** — use the JSON `data` blob.
- **Don't f-string user input into SQL** — always parameterize.
- **Don't open SQLite connections outside `get_conn()`.**
- **Don't deep-merge on PATCH** — replace `data` wholesale.
- **Don't use `git add .` or `git add -A`** — backend `data/` (db files) and the Python venv should never be committed. Stage explicit files.
- **Don't add `Co-Authored-By: Claude` trailers** to commits.
