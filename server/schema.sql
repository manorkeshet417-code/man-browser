-- Man Studio free domains (Cloudflare D1 / SQLite)
CREATE TABLE IF NOT EXISTS sites (
  domain     TEXT PRIMARY KEY,
  title      TEXT NOT NULL DEFAULT '',
  html       TEXT NOT NULL DEFAULT '',
  owner_hash TEXT NOT NULL,
  views      INTEGER NOT NULL DEFAULT 0,
  chunks     INTEGER NOT NULL DEFAULT 0,  -- >0: html is split into site_chunks (big sites, up to 30 MB)
  size       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sites_owner_idx ON sites (owner_hash);
CREATE INDEX IF NOT EXISTS sites_created_idx ON sites (created_at DESC);
CREATE TABLE IF NOT EXISTS site_chunks (
  domain TEXT NOT NULL,
  idx    INTEGER NOT NULL,
  data   TEXT NOT NULL,
  PRIMARY KEY (domain, idx)
);

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
  recovery_hash TEXT,                       -- sha256 of the recovery code (1.7.0)
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

-- Pages and Man Search (added in 1.5.0)
CREATE TABLE IF NOT EXISTS pages (
  domain     TEXT NOT NULL,
  path       TEXT NOT NULL,
  title      TEXT NOT NULL DEFAULT '',
  html       TEXT NOT NULL DEFAULT '',
  chunks     INTEGER NOT NULL DEFAULT 0,
  size       INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (domain, path)
);
CREATE VIRTUAL TABLE IF NOT EXISTS search_idx USING fts5(
  domain UNINDEXED, path UNINDEXED, name, title, body,
  tokenize = 'unicode61 remove_diacritics 2'
);

-- Man Mail (added in 1.7.0): <uname>@man.mail
CREATE TABLE IF NOT EXISTS mails (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  to_uname       TEXT NOT NULL,
  from_uname     TEXT,
  from_name      TEXT NOT NULL,
  subject        TEXT NOT NULL DEFAULT '',
  body           TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL,
  read           INTEGER NOT NULL DEFAULT 0,
  deleted        INTEGER NOT NULL DEFAULT 0,
  sender_deleted INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS mails_to_idx ON mails (to_uname, id);
CREATE INDEX IF NOT EXISTS mails_from_idx ON mails (from_uname, id);
-- Reports and removals (1.9.0): anyone can report a free site; Man Studio (dev) reviews and can remove any site
CREATE TABLE IF NOT EXISTS reports (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  domain     TEXT NOT NULL,
  reason     TEXT NOT NULL,              -- scam | malware | copyright | hate | adult | illegal | other
  details    TEXT NOT NULL DEFAULT '',
  reporter   TEXT,                       -- uname when signed in
  created_at TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open' -- open | removed | dismissed
);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status, id);
CREATE INDEX IF NOT EXISTS reports_domain_idx ON reports (domain);
-- names removed by Man Studio can't be registered again
CREATE TABLE IF NOT EXISTS blocked_domains (
  domain     TEXT PRIMARY KEY,
  reason     TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
