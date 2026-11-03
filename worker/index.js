// Cloudflare Worker for partnerpress.net.
//
// Every request is served from the static Astro build (dist/) except POST
// /api/contact, which emails the "Book a call" form to Shane through Cloudflare
// Email Routing (send_email binding). See README "Contact form".
//
// Worker settings (Cloudflare dashboard, Settings > Variables and secrets):
//   MAIL_TO           secret: where submissions go (a verified Email Routing destination)
//   MAIL_FROM         secret or var: sender on the Email Routing domain, e.g. website@forms.partnerpress.net
//   TURNSTILE_SECRET  secret, optional: turns on the Turnstile spam check

import { EmailMessage } from 'cloudflare:email';

const FIELDS = [
  ['name', 'Name'],
  ['business', 'Business'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['website', 'Website'],
  ['service', 'Needs help with'],
  ['area', 'Business location'],
  ['message', 'Message'],
];
const MAX_FIELD = 5000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') return handleContact(request, env);
    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request, env) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });

  const wantsJson = (request.headers.get('Accept') ?? '').includes('application/json');
  const done = (ok, status = ok ? 200 : 400) =>
    wantsJson
      ? Response.json({ ok }, { status })
      : Response.redirect(new URL(ok ? '/thank-you/' : '/contact/?error=1', request.url), 303);

  let form;
  try {
    form = await request.formData();
  } catch {
    return done(false);
  }
  const get = (key) => String(form.get(key) ?? '').trim().slice(0, MAX_FIELD);

  // Honeypot: bots fill every field. Pretend it worked.
  if (get('company-website')) return done(true);

  const name = get('name');
  const email = get('email');
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return done(false);

  if (env.TURNSTILE_SECRET) {
    const passed = await verifyTurnstile(env.TURNSTILE_SECRET, get('cf-turnstile-response'), request);
    if (!passed) return done(false);
  }

  if (!env.CONTACT_EMAIL || !env.MAIL_TO || !env.MAIL_FROM) {
    console.error('Contact form is not configured: CONTACT_EMAIL binding, MAIL_TO or MAIL_FROM missing.');
    return done(false, 500);
  }

  const body = FIELDS.map(([key, label]) => `${label}: ${get(key) || '-'}`).join('\n\n');
  const raw = buildEmail({
    from: env.MAIL_FROM,
    to: env.MAIL_TO,
    replyTo: email,
    subject: `New call request from ${name}`,
    body: `${body}\n\nSent from ${request.headers.get('Referer') ?? 'partnerpress.net'}\n`,
  });

  try {
    await env.CONTACT_EMAIL.send(new EmailMessage(env.MAIL_FROM, env.MAIL_TO, raw));
  } catch (err) {
    console.error('Contact form email failed:', err);
    return done(false, 502);
  }
  return done(true);
}

async function verifyTurnstile(secret, token, request) {
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

/** Header values must be one line: strip CR/LF so form input can't add headers. */
const oneLine = (value) => String(value).replace(/[\r\n]+/g, ' ');

/** RFC 2047 encoding so names with accents or emoji survive in the subject. */
const encodeHeader = (value) => `=?UTF-8?B?${base64(oneLine(value))}?=`;

function base64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function buildEmail({ from, to, replyTo, subject, body }) {
  const encodedBody = base64(body).replace(/.{76}/g, '$&\r\n');
  return [
    `From: PartnerPress website <${oneLine(from)}>`,
    `To: ${oneLine(to)}`,
    `Reply-To: ${oneLine(replyTo)}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${oneLine(from).split('@')[1]}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodedBody,
  ].join('\r\n');
}
