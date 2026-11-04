// Private admin pages, served by the Worker (never part of the static build).
//
//   GET /admin/submissions             list with search and paging
//   GET /admin/submissions/export.csv  CSV of every submission matching ?q=
//
// Cloudflare Access protects /admin*, and every request is re-checked here
// (worker/access.js), so the pages fail closed if Access is not set up.

import { accessUser } from './access.js';
import { allSubmissions, listSubmissions } from './submissions.js';

const PAGE_SIZE = 50;

const BASE_HEADERS = {
  'Cache-Control': 'no-store, private',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy':
    "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
};

export async function handleAdmin(request, env) {
  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { ...BASE_HEADERS, Allow: 'GET' } });
  }

  const user = await accessUser(request, env);
  if (!user) return text('Not authorized. Sign in through Cloudflare Access.', 403);

  const path = url.pathname.replace(/\/+$/, '');
  if (path === '/admin' || path === '/admin/submissions') {
    if (url.pathname !== '/admin/submissions') {
      return Response.redirect(new URL(`/admin/submissions${url.search}`, url), 302);
    }
    return listPage(url, env, user);
  }
  if (path === '/admin/submissions/export.csv') return exportCsv(url, env);
  return text('Not found', 404);
}

async function listPage(url, env, user) {
  if (!env.DB) return text('The DB (D1) binding is missing on this Worker. See README "Form submissions".', 500);

  const query = (url.searchParams.get('q') ?? '').slice(0, 200);
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const { rows, total } = await listSubmissions(env.DB, { query, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const tz = env.ADMIN_TIMEZONE || 'America/Los_Angeles';

  const link = (params) => {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    for (const [k, v] of Object.entries(params)) if (v) next.set(k, String(v));
    const qs = next.toString();
    return qs ? `?${qs}` : '?';
  };
  const exportHref = `/admin/submissions/export.csv${query ? `?q=${encodeURIComponent(query)}` : ''}`;

  const body = rows.length
    ? rows.map((row) => rowHtml(row, tz)).join('')
    : `<tr><td colspan="6" class="empty">${query ? 'No submissions match that search.' : 'No submissions yet.'}</td></tr>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Form submissions | PartnerPress</title>
<style>${CSS}</style>
</head>
<body>
<header class="top">
  <div class="wrap top-inner">
    <strong class="brand">PartnerPress <span>admin</span></strong>
    <span class="who">${esc(user)} · <a href="/cdn-cgi/access/logout">Sign out</a></span>
  </div>
</header>
<main class="wrap">
  <div class="head">
    <h1>Form submissions</h1>
    <p class="count">${total.toLocaleString('en-US')} ${query ? 'matching' : 'total'}</p>
  </div>
  <div class="tools">
    <form class="search" method="get" action="/admin/submissions" role="search">
      <label class="sr" for="q">Search submissions</label>
      <input id="q" name="q" type="search" value="${esc(query)}" placeholder="Search name, email, business, message...">
      <button type="submit">Search</button>
      ${query ? '<a class="clear" href="/admin/submissions">Clear</a>' : ''}
    </form>
    <a class="btn" href="${esc(exportHref)}">Export CSV</a>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Received</th><th>Name</th><th>Business</th><th>Contact</th><th>Needs help with</th><th>Location</th></tr></thead>
      <tbody>${body}</tbody>
    </table>
  </div>
  ${
    pages > 1
      ? `<nav class="pager" aria-label="Pages">
    ${page > 1 ? `<a href="${esc(link({ page: page - 1 }))}">Newer</a>` : '<span></span>'}
    <span>Page ${page} of ${pages}</span>
    ${page < pages ? `<a href="${esc(link({ page: page + 1 }))}">Older</a>` : '<span></span>'}
  </nav>`
      : ''
  }
</main>
</body>
</html>`;
  return new Response(html, { headers: { ...BASE_HEADERS, 'Content-Type': 'text/html; charset=utf-8' } });
}

function rowHtml(row, tz) {
  const when = formatDate(row.created_at, tz);
  const email = row.email ? `<a href="mailto:${esc(row.email)}">${esc(row.email)}</a>` : '';
  const phone = row.phone ? `<a href="tel:${esc(row.phone.replace(/[^\d+]/g, ''))}">${esc(row.phone)}</a>` : '';
  const website = safeHref(row.website);
  const details = [
    row.message ? `<p class="msg">${esc(row.message)}</p>` : '<p class="muted">No message.</p>',
    `<dl>
      ${row.website ? `<dt>Website</dt><dd>${website ? `<a href="${esc(website)}" rel="noopener noreferrer" target="_blank">${esc(row.website)}</a>` : esc(row.website)}</dd>` : ''}
      ${row.page ? `<dt>Sent from</dt><dd>${esc(row.page)}</dd>` : ''}
      ${row.country ? `<dt>Country</dt><dd>${esc(row.country)}</dd>` : ''}
      <dt>Email alert</dt><dd>${row.email_sent ? 'Sent' : '<span class="warn">Not sent</span>'}</dd>
      <dt>ID</dt><dd>#${row.id}</dd>
    </dl>`,
  ].join('');
  return `<tr class="row">
    <td data-label="Received">${esc(when)}</td>
    <td data-label="Name"><strong>${esc(row.name)}</strong></td>
    <td data-label="Business">${esc(row.business ?? '')}</td>
    <td data-label="Contact">${email}${phone ? `<br>${phone}` : ''}</td>
    <td data-label="Needs help with">${esc(row.service ?? '')}</td>
    <td data-label="Location">${esc(row.area ?? '')}</td>
  </tr>
  <tr class="detail"><td colspan="6"><details><summary>Message and details</summary>${details}</details></td></tr>`;
}

async function exportCsv(url, env) {
  if (!env.DB) return text('The DB (D1) binding is missing on this Worker.', 500);
  const query = (url.searchParams.get('q') ?? '').slice(0, 200);
  const rows = await allSubmissions(env.DB, query);
  const cols = [
    ['id', 'ID'],
    ['created_at', 'Received (UTC)'],
    ['name', 'Name'],
    ['business', 'Business'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['website', 'Website'],
    ['service', 'Needs help with'],
    ['area', 'Business location'],
    ['message', 'Message'],
    ['page', 'Sent from'],
    ['country', 'Country'],
    ['email_sent', 'Email alert sent'],
  ];
  const lines = [cols.map(([, label]) => csvCell(label)).join(',')];
  for (const row of rows) {
    lines.push(
      cols
        .map(([key]) => csvCell(key === 'email_sent' ? (row[key] ? 'yes' : 'no') : row[key]))
        .join(','),
    );
  }
  const date = new Date().toISOString().slice(0, 10);
  // BOM so Excel opens UTF-8 (accents, emoji) correctly.
  return new Response(`﻿${lines.join('\r\n')}\r\n`, {
    headers: {
      ...BASE_HEADERS,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="partnerpress-submissions-${date}.csv"`,
    },
  });
}

/** Quotes a CSV cell and defuses spreadsheet formulas (=, +, -, @ at the start). */
function csvCell(value) {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

function formatDate(iso, tz) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso ?? '';
  try {
    return d.toLocaleString('en-US', {
      timeZone: tz,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return d.toISOString();
  }
}

/** Only http(s) links are clickable; anything else is shown as text. */
function safeHref(value) {
  if (!value) return '';
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const u = new URL(candidate);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}

function esc(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

function text(message, status) {
  return new Response(message, { status, headers: { ...BASE_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' } });
}

const CSS = `
:root{--orange:#f38800;--blue:#2051c5;--ink:#22262e;--text:#363b47;--muted:#6d7486;--line:#e0e3ea;--surface:#f7f8fa;--white:#fff;--warn:#b42318}
*{box-sizing:border-box}
body{margin:0;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--text);background:var(--surface)}
a{color:var(--blue)}
.wrap{max-width:1200px;margin:0 auto;padding:0 16px}
.top{background:var(--white);border-bottom:3px solid var(--orange)}
.top-inner{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding-top:12px;padding-bottom:12px}
.brand{color:var(--ink);font-size:17px}.brand span{color:var(--muted);font-weight:500}
.who{color:var(--muted);font-size:13px}
.head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin:24px 0 12px}
h1{margin:0;font-size:26px;color:var(--ink)}
.count{margin:0;color:var(--muted)}
.tools{display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-bottom:16px}
.search{display:flex;gap:8px;flex:1 1 420px;align-items:center}
.search input{flex:1;min-width:0;padding:9px 12px;border:1px solid #c7ccd6;border-radius:8px;font:inherit;background:var(--white)}
button,.btn{display:inline-block;padding:9px 16px;border-radius:8px;border:0;font:inherit;font-weight:600;cursor:pointer;text-decoration:none;white-space:nowrap}
button{background:var(--ink);color:var(--white)}
.btn{background:var(--orange);color:var(--ink)}
.clear{font-size:14px}
.table-wrap{background:var(--white);border:1px solid var(--line);border-radius:10px;overflow:hidden}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);background:var(--surface);padding:10px 12px;border-bottom:1px solid var(--line)}
td{padding:10px 12px;vertical-align:top}
tr.row td{border-top:1px solid var(--line);word-break:break-word}
tr.row:first-child td{border-top:0}
tr.detail td{padding-top:0}
details summary{cursor:pointer;color:var(--blue);font-size:13px}
.msg{white-space:pre-wrap;margin:8px 0;padding:10px 12px;background:var(--surface);border-radius:8px;color:var(--ink)}
dl{display:grid;grid-template-columns:max-content 1fr;gap:2px 12px;margin:8px 0 4px;font-size:13px}
dt{color:var(--muted)}dd{margin:0;word-break:break-word}
.muted{color:var(--muted)}.warn{color:var(--warn);font-weight:600}
.empty{text-align:center;color:var(--muted);padding:40px 12px}
.pager{display:flex;justify-content:space-between;align-items:center;margin:16px 0 40px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media (max-width:760px){
  thead{display:none}
  table,tbody,tr,td{display:block;width:100%}
  tr.row{border-top:1px solid var(--line);padding-top:6px}
  tr.row:first-child{border-top:0}
  tr.row td{border:0;padding:3px 12px}
  tr.row td:empty{display:none}
  tr.row td::before{content:attr(data-label);display:block;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
  tr.detail td{padding:6px 12px 12px}
}
`;
