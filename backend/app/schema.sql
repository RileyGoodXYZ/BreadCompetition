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
