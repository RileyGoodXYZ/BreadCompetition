CREATE TABLE IF NOT EXISTS submissions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT    NOT NULL CHECK (type IN ('match','subjective','pit','break')),
  scout_name    TEXT    NOT NULL,
  event_key     TEXT,
  match_number  INTEGER,
  team_number   INTEGER NOT NULL,
  session_type  TEXT,
  data          TEXT    NOT NULL,
  client_uuid   TEXT    UNIQUE,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_submissions_team  ON submissions(team_number);
CREATE INDEX IF NOT EXISTS idx_submissions_match ON submissions(event_key, match_number);
CREATE INDEX IF NOT EXISTS idx_submissions_type  ON submissions(type);

-- ---------------------------------------------------------------------------
-- Teams (global catalog)
--
-- Every FRC team we've ever cared about, regardless of which event they're
-- at. The name/drivetrain/image are properties of the team, not the event,
-- so they live here. Anything event-specific (attendance, ranking, OPR)
-- lives in `event_teams` or is derived from `submissions`.
-- Populated either from a TBA sync script or seeded from data/teams.json.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  team_number  INTEGER PRIMARY KEY,
  name         TEXT    NOT NULL,
  data         TEXT    NOT NULL DEFAULT '{}',   -- drivetrain, image_url, nickname, ...
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Events
--
-- One row per competition (regional, district, off-season). `event_key`
-- mirrors TBA's convention (`2026casj` = 2026 Silicon Valley Regional) so we
-- can sync upstream cleanly later. `data` carries display fields the UI
-- already uses on the Home shell (`schedule.js::CURRENT_EVENT`): location,
-- shortName, dates, status string.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  event_key   TEXT    PRIMARY KEY,
  name        TEXT    NOT NULL,
  data        TEXT    NOT NULL DEFAULT '{}',
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Event ↔ Teams (attendance)
--
-- Which teams are at which event. This is what AddRobotDialog and the
-- RobotData search actually want — the ~40 teams at the current regional,
-- not all 3000 teams in FRC.
--
-- Foreign keys cascade so deleting an event scrubs its attendance rows;
-- deleting a team (rare) scrubs that team from every event they were at.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_teams (
  event_key   TEXT    NOT NULL REFERENCES events(event_key) ON DELETE CASCADE,
  team_number INTEGER NOT NULL REFERENCES teams(team_number) ON DELETE CASCADE,
  PRIMARY KEY (event_key, team_number)
);

CREATE INDEX IF NOT EXISTS idx_event_teams_team ON event_teams(team_number);

-- ---------------------------------------------------------------------------
-- Picklists
--
-- One row per picklist. We stash the entire UI-shaped document in `data`
-- (slots, rankings order, column config, collaborators, etc.) until the
-- shape stabilizes — mirrors how `submissions` is modeled. Top-level columns
-- are limited to fields we actually filter or sort by (kind/event/owner).
--
-- `kind` is 'shared' or 'my' to mirror the two Library sections; eventually
-- this should be derived from an ACL/owner_id join, not stored.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS picklists (
  id          TEXT    PRIMARY KEY,
  title       TEXT    NOT NULL,
  event_key   TEXT,
  kind        TEXT    NOT NULL CHECK (kind IN ('shared','my')) DEFAULT 'my',
  owner       TEXT,
  starred     INTEGER NOT NULL DEFAULT 0,
  archived    INTEGER NOT NULL DEFAULT 0,
  data        TEXT    NOT NULL DEFAULT '{}',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_picklists_kind  ON picklists(kind, archived);
CREATE INDEX IF NOT EXISTS idx_picklists_event ON picklists(event_key);
