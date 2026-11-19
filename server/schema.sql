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
