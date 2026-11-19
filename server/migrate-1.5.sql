-- one-time upgrade of the live database for 1.5.0 (pages + Man Search). schema.sql has these for fresh setups.
CREATE TABLE IF NOT EXISTS pages (
  domain     TEXT NOT NULL,
  path       TEXT NOT NULL,              -- "about", "games/one", "style.css" ...
  title      TEXT NOT NULL DEFAULT '',
  html       TEXT NOT NULL DEFAULT '',
  chunks     INTEGER NOT NULL DEFAULT 0, -- >0: content is in site_chunks under "<domain>/<path>"
  size       INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (domain, path)
);
CREATE VIRTUAL TABLE IF NOT EXISTS search_idx USING fts5(
  domain UNINDEXED, path UNINDEXED, name, title, body,
  tokenize = 'unicode61 remove_diacritics 2'
);
