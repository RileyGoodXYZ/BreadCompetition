---
name: scouting-architecture
description: Use when working on the BreadCompetition backend or wiring frontend pages to it — covers how scouting data flows, what each table and router is for, and the conventions to follow when adding new endpoints. Trigger when adding/modifying API routes, designing new submission types, building aggregation queries, or replacing frontend mocks with real fetches.
---

# Scouting System Architecture

BreadCompetition is FRC scouting software for team 5940. Backend is a single
FastAPI app over SQLite (`backend/`); frontend is React 19 + Vite (`frontend/`).
This skill captures the architecture and the conventions you must follow when
extending it.

## The big picture

```
                           ┌──────────────────┐
   Scouts on phones  ────► │  POST /scouting  │ ──► submissions table
                           └──────────────────┘
                                                     │
                                                     │ raw forms
                                                     ▼
                           ┌──────────────────┐    ┌─────────────────┐
   Picklist / Robot   ◄──── │   GET endpoints  │ ◄── │ aggregation     │
   Data / Strategy        │  + JSON shaping  │    │ (NOT YET BUILT) │
   pages                  └──────────────────┘    └─────────────────┘
```

There is **one source of truth** (`submissions` table) for raw scouting data,
and a layer of resource tables (`teams`, `events`, `event_teams`, `picklists`,
`strategies`) that hold UI-owned state and catalog data. The aggregation
layer — EPA, BPS, throughput, rankings — does not exist yet; it's the next
major piece of work and is the bridge between `submissions` and the picklist
/ robot-data / strategy views.

## Repo layout

```
backend/
  app/
    config.py          Settings (DB_PATH, CORS_ORIGINS, TBA_API_KEY) via pydantic-settings
    db.py              sqlite3 + WAL + foreign_keys=ON; get_conn() context mgr
    schema.sql         Every CREATE TABLE / CREATE INDEX (idempotent IF NOT EXISTS)
    models.py          All Pydantic models, one section per resource
    main.py            FastAPI app, CORS, router registration
    routers/
      health.py        GET /api/health
      scouting.py      POST /api/scouting/{match|subjective|pit|break}
      submissions.py   GET /api/submissions, /api/submissions/{id}
      teams.py         Global team catalog + per-team submissions view  [reference]
      events.py        Event metadata + attendance CRUD (501 stubs) + matches stub
      picklists.py     Picklist-document CRUD — student-exercise stub (501s)
      strategies.py    Match-strategy CRUD — student-exercise stub (501s)
  data/                SQLite db lives here (gitignored)
  scripts/
    init_db.py         Apply schema.sql to data/app.db
    seed_demo_data.py  Fill all six tables with real 2026arc data pulled from
                       TBA (roster, schedule, scores, rankings, robot photos;
                       needs TBA_API_KEY in .env) + Statbotics EPA; per-robot
                       form values synthesized to match real alliance totals;
                       API responses cached in data/api_cache/ (--refresh to
                       re-fetch); idempotent — deterministic client_uuids +
                       ON CONFLICT upserts; --reset drops seed-owned rows;
                       match `data` blobs mirror Submit.jsx::buildPayload
                       key-for-key
```

### Student-exercise stubs vs. reference implementations

`picklists.py`, `strategies.py`, and `events.py` are **intentionally stubbed
for the robotics team's students to implement.** Every handler keeps its route
decorator, signature, helpers, and Pydantic models, but the body is
`raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO(student): see docstring")`
and the docstring is a step-by-step build guide. (The exception: `events.py`'s
`GET /matches` is a *planning* stub returning `[]` — the design isn't chosen
yet, so it's not an exercise.)

`teams.py`, `submissions.py`, and `scouting.py` are the **complete, working
reference implementations** students study — the stub docstrings point at them
by name. Keep them implemented and idiomatic; they're the worked examples.

When you implement (or grade) a stub, follow the conventions below and the
guidance in each docstring — don't invent a different shape.

## Database — six tables, two relationships

```
            ┌──────────────┐
            │   events     │ (event_key PK)
            └─────┬────────┘
                  │ FK cascade
                  ▼
        ┌────────────────────┐         ┌──────────────┐
        │   event_teams      │ ──FK──► │    teams     │ (team_number PK)
        │ (event_key, team#) │         └──────┬───────┘
        └────────────────────┘                │
                                              │ team_number (no FK; submissions
                                              │  predate teams and may name
                                              │  teams not in the catalog)
                                              ▼
                                      ┌────────────────┐
                                      │  submissions   │ (id PK)
                                      │ (raw forms;    │
                                      │  type+data)    │
                                      └────────────────┘

         ┌──────────────┐    ┌──────────────┐
         │  picklists   │    │  strategies  │   (free-standing docs;
         └──────────────┘    └──────────────┘    reference event_key
                                                 and team numbers by
                                                 convention, no FK)
```

| Table | Purpose | Notes |
|---|---|---|
| `submissions` | Raw scouting forms | Polymorphic via `type` discriminator; body in JSON `data` |
| `teams` | Global team catalog | Name/drivetrain/image; nothing event-specific |
| `events` | Competition metadata | `event_key` mirrors TBA (`2026casj`) for future sync |
| `event_teams` | Attendance join | Cascade-delete from both sides; PK is composite |
| `picklists` | Picklist documents | UI-shaped body in `data`; only filterable fields hoisted |
| `strategies` | Match-strategy docs | Same modeling story as picklists |

### Why JSON `data` blobs everywhere

Every domain table has a `data TEXT NOT NULL DEFAULT '{}'` column. This is
deliberate: the UI shape is still moving, and we don't want to schema-churn
every time the frontend adds a field. Only **fields we filter, sort, or join
on** get promoted to real columns. This pattern shows up in submissions,
teams, events, picklists, and strategies.

**Trade-off:** you can't index inside the JSON or query its fields from SQL
without `json_extract`. That's fine for now — aggregation queries that need
to dig into `submissions.data` will do so explicitly and may eventually want
materialized views.

## Routers — conventions to follow

Every router file follows the same shape. **Read this before adding a new
one:**

1. **Module-level `router = APIRouter(prefix="/api/<resource>", tags=["<resource>"])`.**
   Prefix lives here, not in `main.py`.

2. **A `_row_to_dict(row)` helper** at module top that JSON-decodes the `data`
   column and coerces SQLite booleans (stored as INTEGER) to real bools.
   If the file serves rows from two different tables, give each helper a
   typed name (`_team_row_to_dict`, `_submission_row_to_dict`).

3. **Use `with get_conn() as conn:`** — never module-level connections. The
   context manager handles cleanup and respects WAL mode.

4. **Parameterized queries always.** Never f-string user input into SQL.
   Build `clauses: list[str]` and `params: list[Any]` and join.

5. **Standard CRUD verb mapping:**
   - `GET /<resource>`        → list (with filters as query params)
   - `GET /<resource>/{id}`   → one (404 on miss)
   - `POST /<resource>`       → create (201)
   - `PATCH /<resource>/{id}` → partial update (use `model_dump(exclude_unset=True)`)
   - `PUT /<resource>/{id}`   → idempotent upsert (200) — reserved for admin/seed
   - `DELETE /<resource>/{id}` → 204

6. **Status codes from `fastapi.status`,** not magic numbers.

7. **Errors via `HTTPException`** with `status_code=status.HTTP_404_NOT_FOUND`
   and a `detail` string. Don't return error JSON manually.

8. **List endpoints have `limit` and `offset` query params** with reasonable
   `ge=1`, `le=1000` bounds. Default `limit=100` unless the resource really
   needs more (teams uses 500 because the AddRobot picker wants the whole
   event at once).

9. **Idempotency for writes that the client retries:**
   - Submissions use `client_uuid` (returns existing row on duplicate, 200
     instead of 201). See `scouting.py::_insert` for the pattern.
   - Teams and events use `PUT` + `ON CONFLICT DO UPDATE`.
   - Picklists and strategies don't have idempotency yet — they're user
     actions, not retried.

10. **Wholesale `data` replacement on PATCH,** not deep merge. The frontend
    sends the full document; the server doesn't need to be smart about it.

## Models — conventions

Everything lives in `models.py`, one section per resource, separated by a
banner comment. The pattern per resource:

```python
class FooBase(BaseModel):           # shared fields
    ...

class FooCreate(FooBase):           # what POST accepts (may add optional id)
    id: Optional[str] = None

class FooUpdate(BaseModel):         # what PATCH accepts (all optional, NOT inheriting)
    field: Optional[T] = None

class FooRecord(FooBase):           # what we return (includes server-set fields)
    id: str
    created_at: datetime
    updated_at: datetime
```

`FooUpdate` deliberately doesn't inherit from `FooBase` because every field
must be optional for partial updates, and re-declaring is clearer than
fighting Pydantic to override required-ness.

## Submission types — the scouting flow

Four polymorphic submission types, all written to one table:

| Type | When it's submitted | UI page |
|---|---|---|
| `match` | After each match a scout watches | `pages/data-scout/Auto.jsx` + `Teleop.jsx` + `Endgame.jsx` |
| `subjective` | Qualitative review of a robot | (planned) |
| `pit` | Pit scouting (per-robot, not per-match) | `pages/data-scout/Prematch.jsx` |
| `break` | Robot failure / mechanical break | (planned) |

Adding a new submission type:

1. Add the literal to `SubmissionType` in `models.py`.
2. Add a `<NewType>Submission(SubmissionBase)` class (often empty — the body
   stays in `data`).
3. Add `POST /api/scouting/<new-type>` in `scouting.py`, delegating to
   `_insert(payload, "<new-type>", response)`.
4. Update the CHECK constraint in `schema.sql`. **SQLite doesn't ALTER CHECK
   constraints** — for a new dev DB just delete `backend/data/app.db` and
   re-init. For real data, write a migration that renames-and-copies.

**Do not** create a new table per submission type. The polymorphic shape is
deliberate; aggregation queries scan `submissions` once and filter by `type`.

## Frontend integration — what to replace and how

Each frontend page currently has a mock data file or an in-memory store.
The migration to real API is a per-page swap:

| Page | Today reads from | Replace with |
|---|---|---|
| Picklist Library | `picklists-store.jsx` | `GET /api/picklists?kind={shared|my}` |
| Picklist Manager | same store | `GET /api/picklists/{id}` + `PATCH` on save |
| RobotData | `pages/picklist/data.js::TEAM_POOL` + `ROBOT_ANALYTICS_BY_TEAM` | `GET /api/events/{key}/teams` + (future) `GET /api/teams/{n}/analytics` |
| AddRobotDialog | `TEAM_POOL` (passed via prop) | `GET /api/events/{key}/teams` |
| ScoutNotesDialog | `SCOUT_NOTES` mock | `GET /api/teams/{n}/submissions?type=subjective` (needs projection) |
| Strategy Library | `match-strategy-store.jsx` | `GET /api/strategies?event={key}` |
| Strategy Detail | same store | `GET /api/strategies/{id}` + `PATCH` on every edit (debounce!) |
| Home shell event banner | `lib/schedule.js::CURRENT_EVENT` | `GET /api/events/{key}` |
| Upcoming matches | `lib/schedule.js::UPCOMING_MATCHES` | `GET /api/events/{key}/matches` (currently stub) |

When wiring a PATCH from a high-frequency edit (Strategy Detail cell edits
fire on every keystroke), **debounce client-side** (250–500ms). The server
isn't optimized to handle 60 PATCH/s per user.

## What's missing — the next major work

In rough priority order:

1. **Aggregation endpoints.** `GET /api/teams/{n}/analytics`,
   `GET /api/rankings?event=`, projection for ScoutNotesDialog. These
   compute EPA/BPS/throughput/etc. from `submissions.data`. Likely lives
   in a new `app/services/analytics.py` so routers stay thin.

2. **Match schedule.** `GET /api/events/{key}/matches` is a stub. Two
   options: TBA proxy with short cache, or a `matches` table populated
   by a sync job. See the docstring in `events.py` for the trade-off.

3. **Auth.** Every endpoint is open. `owner` and `collaborators` fields
   on picklists exist but are unused. When auth lands, picklist `kind=my`
   should be scoped to the session user.

4. **Optimistic concurrency on PATCH.** Picklist and strategy updates
   are last-write-wins. Add `If-Match: <updated_at>` once multiple
   strategists edit the same match concurrently.

## Anti-patterns — don't do these

- **Don't put route logic in `main.py`.** Only registration goes there.
- **Don't create a new router file per submission type** — extend `scouting.py`.
- **Don't add a column for every new UI field.** Use the `data` JSON.
- **Don't hand-write SQL with f-strings.** Always parameterize.
- **Don't open connections outside `get_conn()`.** Use the context manager.
- **Don't return error dicts.** Raise `HTTPException` with `fastapi.status`.
- **Don't deep-merge on PATCH.** Replace `data` wholesale.
- **Don't use `git add .`** when committing — stage explicit files. The
  repo has `backend/data/` (db files) and a Python venv that should never
  be committed.

## Quick reference — adding a new resource

1. Add CREATE TABLE in `schema.sql` (always `IF NOT EXISTS`, always with a
   `data TEXT NOT NULL DEFAULT '{}'` column unless the resource is purely
   relational).
2. Add `FooBase` / `FooCreate` / `FooUpdate` / `FooRecord` models in
   `models.py`.
3. Create `app/routers/foo.py` following the conventions above.
4. Register in `main.py`: import and `app.include_router(foo.router)`.
5. Delete `backend/data/app.db` to re-init the schema in dev.
6. Verify with `cd backend && .venv/bin/python -c "from app.main import app; print('ok')"`
   and check the route surface at `/docs`.
