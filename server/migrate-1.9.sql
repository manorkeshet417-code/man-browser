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
