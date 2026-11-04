-- Contact form submissions. The Worker also creates this table on first use
-- (worker/submissions.js), so applying this migration by hand is optional:
--   npx wrangler d1 migrations apply partnerpress-forms --remote
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  name TEXT NOT NULL,
  business TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  service TEXT,
  area TEXT,
  message TEXT,
  page TEXT,
  country TEXT,
  email_sent INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS submissions_created_at ON submissions (created_at DESC);
