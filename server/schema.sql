-- Man Studio free domains (Cloudflare D1 / SQLite)
CREATE TABLE IF NOT EXISTS sites (
  domain     TEXT PRIMARY KEY,
  title      TEXT NOT NULL DEFAULT '',
  html       TEXT NOT NULL DEFAULT '',
  owner_hash TEXT NOT NULL,
  views      INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sites_owner_idx ON sites (owner_hash);
CREATE INDEX IF NOT EXISTS sites_created_idx ON sites (created_at DESC);

-- Man Browser accounts (added in 1.2.0)
CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  username     TEXT NOT NULL,              -- as typed, e.g. "Man Studio"
  uname        TEXT NOT NULL UNIQUE,       -- normalized for uniqueness, e.g. "manstudio"
  pass_hash    TEXT NOT NULL,              -- PBKDF2-SHA256
  salt         TEXT NOT NULL,
  iterations   INTEGER NOT NULL,
  role         TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'dev'
  failed       INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at   TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,             -- sha256 of the token the browser keeps
  user_id    INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  last_used  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
-- the name "Man Studio" can be claimed once; whoever claims it becomes the dev, then this closes
INSERT OR IGNORE INTO meta (key, value) VALUES ('dev_signup_open', '1');
