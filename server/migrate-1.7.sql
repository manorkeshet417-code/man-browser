-- one-time upgrade of the live database for 1.7.0 (recovery codes + Man Mail). schema.sql has these for fresh setups.
ALTER TABLE users ADD COLUMN recovery_hash TEXT;
CREATE TABLE IF NOT EXISTS mails (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  to_uname       TEXT NOT NULL,              -- <to_uname>@man.mail
  from_uname     TEXT,                       -- NULL = a message from Man Browser itself
  from_name      TEXT NOT NULL,
  subject        TEXT NOT NULL DEFAULT '',
  body           TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL,
  read           INTEGER NOT NULL DEFAULT 0,
  deleted        INTEGER NOT NULL DEFAULT 0, -- deleted by the receiver
  sender_deleted INTEGER NOT NULL DEFAULT 0  -- deleted from the sender's "Sent"
);
CREATE INDEX IF NOT EXISTS mails_to_idx ON mails (to_uname, id);
CREATE INDEX IF NOT EXISTS mails_from_idx ON mails (from_uname, id);
-- accounts made before Man Mail get a welcome message
INSERT INTO mails (to_uname, from_uname, from_name, subject, body, created_at)
  SELECT uname, NULL, 'Man Browser', 'Welcome to Man Mail 👋',
    'Hi ' || username || '!' || char(10) || char(10) || 'This is Man Mail, your inbox inside Man Browser. Your address is ' || uname || '@man.mail.' || char(10) || char(10) ||
    'Important: your account has no recovery code yet. Make one now in Account → Recovery code, and keep it somewhere safe: it''s the only way back in if you forget your password.',
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  FROM users;
