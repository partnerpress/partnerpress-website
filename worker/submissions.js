// Contact form submissions in Cloudflare D1 (the DB binding in wrangler.jsonc).
// The schema matches migrations/0001_submissions.sql. The Worker creates the
// table on first use, so a fresh database works without running migrations.

export const COLUMNS = ['name', 'business', 'email', 'phone', 'website', 'service', 'area', 'message'];
const SEARCHABLE = COLUMNS;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS submissions (
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
  )`,
  'CREATE INDEX IF NOT EXISTS submissions_created_at ON submissions (created_at DESC)',
];

/** Runs the CREATE statements once per Worker instance. */
let ready;
function ensureTable(db) {
  ready ??= db.batch(SCHEMA.map((sql) => db.prepare(sql))).catch((err) => {
    ready = undefined;
    throw err;
  });
  return ready;
}

/** Saves one submission and returns its id. */
export async function saveSubmission(db, fields, meta) {
  await ensureTable(db);
  const values = COLUMNS.map((key) => fields[key] || null);
  const row = await db
    .prepare(
      `INSERT INTO submissions (${COLUMNS.join(', ')}, page, country)
       VALUES (${COLUMNS.map(() => '?').join(', ')}, ?, ?) RETURNING id`,
    )
    .bind(...values, meta.page || null, meta.country || null)
    .first();
  return row.id;
}

export async function markEmailed(db, id) {
  await db.prepare('UPDATE submissions SET email_sent = 1 WHERE id = ?').bind(id).run();
}

/** WHERE clause for a free text search across every form field. */
function searchClause(query) {
  const q = query.trim();
  if (!q) return { where: '', params: [] };
  const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  return {
    where: `WHERE ${SEARCHABLE.map((col) => `${col} LIKE ? ESCAPE '\\'`).join(' OR ')}`,
    params: SEARCHABLE.map(() => like),
  };
}

/** One page of submissions, newest first, plus the total that match. */
export async function listSubmissions(db, { query = '', limit = 50, offset = 0 } = {}) {
  await ensureTable(db);
  const { where, params } = searchClause(query);
  const [rows, total] = await db.batch([
    db
      .prepare(`SELECT * FROM submissions ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
      .bind(...params, limit, offset),
    db.prepare(`SELECT COUNT(*) AS n FROM submissions ${where}`).bind(...params),
  ]);
  return { rows: rows.results, total: total.results[0].n };
}

/** Every matching submission (for CSV export). */
export async function allSubmissions(db, query = '') {
  await ensureTable(db);
  const { where, params } = searchClause(query);
  const { results } = await db
    .prepare(`SELECT * FROM submissions ${where} ORDER BY created_at DESC, id DESC`)
    .bind(...params)
    .all();
  return results;
}

/** Deletes submissions by id. Returns how many rows were removed. */
export async function deleteSubmissions(db, ids) {
  await ensureTable(db);
  // D1 allows 100 bound parameters per statement, so delete in chunks.
  const statements = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    statements.push(db.prepare(`DELETE FROM submissions WHERE id IN (${chunk.map(() => '?').join(', ')})`).bind(...chunk));
  }
  const results = await db.batch(statements);
  return results.reduce((sum, r) => sum + (r.meta?.changes ?? 0), 0);
}
