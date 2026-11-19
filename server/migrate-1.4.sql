-- one-time upgrade of the live database for 1.4.0 (big sites). schema.sql already has these for fresh setups.
ALTER TABLE sites ADD COLUMN chunks INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sites ADD COLUMN size INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS site_chunks (domain TEXT NOT NULL, idx INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY (domain, idx));
UPDATE sites SET size = length(html);
