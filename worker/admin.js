// Private admin pages, served by the Worker (never part of the static build).
//
//   GET /admin/submissions             list with search and paging
//   GET /admin/submissions/export.csv  CSV of every submission matching ?q=
//   POST /admin/submissions/delete     deletes the posted ids (one or many)
//
// Cloudflare Access protects /admin*, and every request is re-checked here
// (worker/access.js), so the pages fail closed if Access is not set up.

import { accessUser } from './access.js';
import { allSubmissions, deleteSubmissions, listSubmissions } from './submissions.js';

const PAGE_SIZE = 50;
/** Most ids one delete request may carry (a page is 50). */
const MAX_DELETE = 500;

const BASE_HEADERS = {
  'Cache-Control': 'no-store, private',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  // same-origin, not no-referrer: with no-referrer browsers send "Origin: null" on
  // form posts, which the delete check below would refuse.
  'Referrer-Policy': 'same-origin',
};

/** CSP with a per-response nonce, so only the page's own inline script runs. */
const csp = (nonce) =>
  `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src 'self' data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`;
const STRICT_CSP = csp('none');

export async function handleAdmin(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  const isDelete = path === '/admin/submissions/delete';
  const allowed = isDelete ? ['POST'] : ['GET', 'HEAD'];
  if (!allowed.includes(request.method)) {
    return new Response('Method not allowed', {
      status: 405,
      headers: { ...BASE_HEADERS, 'Content-Security-Policy': STRICT_CSP, Allow: allowed.join(', ') },
    });
  }

  const user = await accessUser(request, env);
  if (!user) return text('Not authorized. Sign in through Cloudflare Access.', 403);

  if (isDelete) return deletePosted(request, url, env, user);
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
  const requested = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  let page = requested;
  let { rows, total } = await listSubmissions(env.DB, { query, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // After deleting the last rows of the last page, show the new last page.
  if (!rows.length && page > pages) {
    page = pages;
    ({ rows, total } = await listSubmissions(env.DB, { query, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }));
  }
  const deleted = Number.parseInt(url.searchParams.get('deleted') ?? '', 10);
  const nonce = crypto.randomUUID().replace(/-/g, '');
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
    : `<tr><td colspan="7" class="empty">${query ? 'No submissions match that search.' : 'No submissions yet.'}</td></tr>`;
  // Where to land after a delete: this same search and page.
  const back = `/admin/submissions${link({ page: page > 1 ? page : '' }).replace(/^\?$/, '')}`;

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
  ${
    Number.isFinite(deleted) && deleted >= 0
      ? `<p class="notice" role="status">Deleted ${deleted} submission${deleted === 1 ? '' : 's'}.</p>`
      : ''
  }
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
    <div class="actions">
      <button type="submit" form="bulk" class="danger" data-bulk-delete${rows.length ? '' : ' disabled'}>Delete selected</button>
      <a class="btn" href="${esc(exportHref)}">Export CSV</a>
    </div>
  </div>
  <form id="bulk" method="post" action="/admin/submissions/delete" data-confirm="bulk">
    <input type="hidden" name="back" value="${esc(back)}">
  </form>
  <form id="one" method="post" action="/admin/submissions/delete" data-confirm="one">
    <input type="hidden" name="back" value="${esc(back)}">
  </form>
  <div class="table-wrap">
    <table>
      <thead><tr><th class="pick"><input type="checkbox" data-select-all aria-label="Select all on this page"${rows.length ? '' : ' disabled'}></th><th>Received</th><th>Name</th><th>Business</th><th>Contact</th><th>Needs help with</th><th>Location</th></tr></thead>
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
<script nonce="${nonce}">${SCRIPT}</script>
</body>
</html>`;
  return new Response(html, {
    headers: { ...BASE_HEADERS, 'Content-Security-Policy': csp(nonce), 'Content-Type': 'text/html; charset=utf-8' },
  });
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
    </dl>
    <button type="submit" form="one" name="id" value="${row.id}" class="danger small" data-name="${esc(row.name)}">Delete this submission</button>`,
  ].join('');
  return `<tr class="row">
    <td class="pick"><input type="checkbox" form="bulk" name="id" value="${row.id}" data-pick aria-label="Select ${esc(row.name)}"></td>
    <td data-label="Received">${esc(when)}</td>
    <td data-label="Name"><strong>${esc(row.name)}</strong></td>
    <td data-label="Business">${esc(row.business ?? '')}</td>
    <td data-label="Contact">${email}${phone ? `<br>${phone}` : ''}</td>
    <td data-label="Needs help with">${esc(row.service ?? '')}</td>
    <td data-label="Location">${esc(row.area ?? '')}</td>
  </tr>
  <tr class="detail"><td></td><td colspan="6"><details><summary>Message and details</summary>${details}</details></td></tr>`;
}

async function deletePosted(request, url, env, user) {
  // Forms on this page only: a cross-site post never carries this site's Origin.
  const sameSite =
    request.headers.get('Origin') === url.origin || request.headers.get('Sec-Fetch-Site') === 'same-origin';
  if (!sameSite) return text('Forbidden', 403);
  if (!env.DB) return text('The DB (D1) binding is missing on this Worker.', 500);

  let form;
  try {
    form = await request.formData();
  } catch {
    return text('Bad request', 400);
  }
  const ids = [...new Set(form.getAll('id').map((v) => Number(v)))].filter((n) => Number.isSafeInteger(n) && n > 0);
  if (ids.length > MAX_DELETE) return text(`Too many at once (max ${MAX_DELETE}).`, 400);

  const count = ids.length ? await deleteSubmissions(env.DB, ids) : 0;
  console.log(`Admin ${user} deleted ${count} submission(s): ${ids.join(', ')}`);

  // Only return to an admin list URL on this site.
  const backRaw = String(form.get('back') ?? '');
  const back = backRaw.startsWith('/admin/submissions') && !backRaw.startsWith('//') ? backRaw : '/admin/submissions';
  const dest = new URL(back, url);
  dest.searchParams.set('deleted', String(count));
  return new Response(null, { status: 303, headers: { ...BASE_HEADERS, Location: dest.pathname + dest.search } });
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
      'Content-Security-Policy': STRICT_CSP,
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
  return new Response(message, {
    status,
    headers: { ...BASE_HEADERS, 'Content-Security-Policy': STRICT_CSP, 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

const CSS = `
:root{--orange:#f38800;--blue:#2051c5;--ink:#22262e;--text:#363b47;--muted:#6d7486;--line:#e0e3ea;--surface:#f7f8fa;--white:#fff;--warn:#b42318}
*{box-sizing:border-box}
body{margin:0;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--text);background:var(--surface)}
a{color:var(--blue)}
.wrap{max-width:1200px;margin:0 auto;padding:0 16px}
.top{background:var(--white);border-bottom:3px solid var(--blue)}
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
.btn{background:var(--blue);color:var(--white)}
.actions{display:flex;gap:8px;flex-wrap:wrap}
button.danger{background:var(--white);color:var(--warn);border:1px solid var(--warn)}
button.danger:hover:not(:disabled){background:var(--warn);color:var(--white)}
button:disabled{opacity:.45;cursor:not-allowed}
button.small{padding:5px 10px;font-size:13px;margin-top:6px}
.notice{margin:16px 0 0;padding:10px 14px;border-radius:8px;background:#e8f5ee;color:#14532d;font-weight:600}
th.pick,td.pick{width:36px;padding-right:0}
.pick input{width:16px;height:16px;cursor:pointer}
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
  tr.row td.pick{float:right;width:auto;padding-top:6px}
  tr.row td.pick::before{content:none}
  tr.detail td:first-child{display:none}
  tr.row td::before{content:attr(data-label);display:block;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
  tr.detail td{padding:6px 12px 12px}
}
`;

// Select all, live count on "Delete selected", and a confirm before deleting.
const SCRIPT = `
(() => {
  const picks = () => [...document.querySelectorAll('[data-pick]')];
  const all = document.querySelector('[data-select-all]');
  const bulk = document.querySelector('[data-bulk-delete]');
  const sync = () => {
    const n = picks().filter((p) => p.checked).length;
    bulk.disabled = n === 0;
    bulk.textContent = n ? 'Delete selected (' + n + ')' : 'Delete selected';
    if (all) {
      all.checked = n > 0 && n === picks().length;
      all.indeterminate = n > 0 && n < picks().length;
    }
  };
  all?.addEventListener('change', () => { picks().forEach((p) => { p.checked = all.checked; }); sync(); });
  document.addEventListener('change', (e) => { if (e.target.matches('[data-pick]')) sync(); });
  sync();

  let who = '';
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button[form="one"]');
    if (b) who = b.dataset.name || 'this submission';
  });
  document.querySelectorAll('form[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      const n = picks().filter((p) => p.checked).length;
      const msg = form.dataset.confirm === 'bulk'
        ? 'Delete ' + n + ' submission' + (n === 1 ? '' : 's') + '? This cannot be undone.'
        : 'Delete the submission from ' + who + '? This cannot be undone.';
      if (!confirm(msg)) e.preventDefault();
    });
  });
})();
`;
