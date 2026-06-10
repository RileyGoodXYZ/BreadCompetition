# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

After every code change, you MUST:
1. If backend Python files changed, run `cd backend && .venv/bin/python -c "from app.main import app; print('ok')"` to verify the app still imports
2. If frontend files changed, run `cd frontend && npm run build` to verify the build
3. If `backend/app/schema.sql` changed, delete `backend/data/app.db` so the new schema gets re-applied on next startup
4. If the change affects the backend architecture (routers added/removed/stubbed, tables, the resource/data model, or router conventions), evaluate it against the `scouting-architecture` skill (`.claude/skills/scouting-architecture/SKILL.md`) and update the skill so it stays accurate. The skill is the source of truth for new contributors — don't let it drift.

Fix any errors before reporting the task as complete.

## Git workflow

**YOU MUST never commit directly to `main` or `backend/foundation`.** Every change goes on a feature branch and ships through a PR you open with `gh pr create` before reporting the task complete. No exceptions for "small" changes — if it's worth doing, it's worth a branch.

Branch naming: `<area>/<short-kebab-description>` — e.g. `backend/picklists-crud`, `frontend/manager-realtime`, `docs/claude-md-workflow-rules`. Branch from `main` for independent work, or from the parent feature branch when continuing a thread.

### Commit in an atomic stack

Build the work as an ordered sequence of small, self-contained commits. Each commit MUST:

- **Group by concern, not by file.** A new resource that touches schema + models + router + main.py wiring is ONE commit, not four. A schema change plus an unrelated frontend tweak is TWO commits, not one.
- **Leave the tree green.** The repo must build, import, and pass relevant checks at every commit in the stack — never "WIP" or "fix typo in last commit" commits. If a check breaks mid-stack, squash before pushing.
- **Be independently revertible.** A reviewer should be able to drop any single commit without taking unrelated work down with it.
- **Have a message that explains the *why*.** Subject in imperative mood, scoped with a prefix (`backend:`, `frontend:`, `docs:`). Body explains motivation and trade-offs, not a diff restatement.

Single-commit changes are fine when the work is genuinely one concern (typo, single-file refactor, one-line bugfix). Don't pad a small change into a fake stack.

### Opening the PR

After pushing the branch, open a PR with `gh pr create --base <base-branch>`. The body MUST include:

1. **Summary** — one short paragraph: what this is, what it isn't.
2. **Commit stack** — the ordered list of commits in this PR with a one-line description of each. This is how reviewers understand the intended logical breakdown.
3. **Test plan** — a checklist of verifications a reviewer can run.

Target the right base: usually `main`, but if this branch builds on another open PR's branch, target that branch so the diff stays scoped.

### Things you must NEVER do

- `git add .` or `git add -A` — always stage explicit files. The repo has `backend/data/` (db files) and `.venv/` that should never be committed.
- `--no-verify`, `--no-gpg-sign`, or any flag that bypasses hooks or signing. If a hook fails, fix the underlying issue.
- `git commit --amend` on a pushed commit — create a new commit instead.
- `git push --force` to `main` or any shared branch. Force-push only to your own feature branch, only if you understand the consequences, and prefer `--force-with-lease` over `--force`.
- Add a `Co-Authored-By: Claude` trailer (or any Claude co-author line) to commit messages.

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

### Database — seven tables
```
events ──┬──► event_teams ──► teams ◄── submissions  (team_number, no FK)
         │                       ▲
         └──► matches            │ aggregation queries (future)
        (TBA-synced)            │
picklists, strategies (free-standing JSON documents, reference event_key/team
numbers by convention)
```

| Table | Purpose |
|---|---|
| `submissions` | Raw scouting forms (4 types, JSON body) |
| `teams` | Global team catalog (name, drivetrain, image) |
| `events` | Competition metadata (`event_key` mirrors TBA); TBA-synced |
| `event_teams` | Attendance join (which teams at which event) |
| `matches` | Match schedule + results, synced from The Blue Alliance |
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
| `backend/app/routers/events.py` | Event metadata + attendance roster + matches read |
| `backend/app/routers/picklists.py` | Picklist CRUD (Library + Manager pages) |
| `backend/app/routers/strategies.py` | Strategy CRUD (Library + Detail pages) |
| `backend/app/routers/tba.py` | The Blue Alliance manual sync endpoint |
| `backend/app/services/tba.py` | TBA read client + `sync_event()` (events, teams, matches) |
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

(Git-workflow anti-patterns live in the Git workflow section above.)

- **Don't put route logic in `main.py`** — only registration.
- **Don't create a new router per submission type** — extend `scouting.py`; the table is polymorphic.
- **Don't add a column for every new UI field** — use the JSON `data` blob.
- **Don't f-string user input into SQL** — always parameterize.
- **Don't open SQLite connections outside `get_conn()`.**
- **Don't deep-merge on PATCH** — replace `data` wholesale.
