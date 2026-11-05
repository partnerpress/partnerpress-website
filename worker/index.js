// Cloudflare Worker for partnerpress.net.
//
// Every request is served from the static Astro build (dist/) except:
//   POST /api/contact  saves the "Book a call" form to D1 (DB binding) and emails
//                      it to Shane through Cloudflare Email Sending (send_email binding)
//   /admin/*           private submissions dashboard (worker/admin.js), behind Cloudflare Access
// See README "Contact form" and "Form submissions".
//
// Worker settings (Cloudflare dashboard, Settings > Variables and secrets):
//   MAIL_TO             secret: where submissions go (a verified destination address)
//   MAIL_FROM           secret: sender on the onboarded Email Sending domain, e.g. website@partnerpress.net
//   TURNSTILE_SECRET    secret, optional: turns on the Turnstile spam check
//   ACCESS_TEAM_DOMAIN  variable: Zero Trust team domain, e.g. partnerpress.cloudflareaccess.com
//   ACCESS_AUD          variable: the Access application's AUD tag (admin is locked without both)

import { EmailMessage } from 'cloudflare:email';
import { handleAdmin } from './admin.js';
import { markEmailed, saveSubmission } from './submissions.js';

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
/** The form is a few KB at most; refuse anything far bigger before reading it. */
const MAX_BODY = 64 * 1024;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') return handleContact(request, env);
    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) return handleAdmin(request, env);
    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request, env) {
  const url = new URL(request.url);
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });

  const wantsJson = (request.headers.get('Accept') ?? '').includes('application/json');
  const done = (ok, status = ok ? 200 : 400) =>
    wantsJson
      ? Response.json({ ok }, { status })
      : Response.redirect(new URL(ok ? '/thank-you/' : '/contact/?error=1', request.url), 303);

  // Only accept posts from a page on this same site (blocks other sites posting the form).
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) return done(false, 403);

  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY) return done(false, 413);

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
  const phoneDigits = get('phone').replace(/\D/g, '');
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phoneDigits.length < 10) return done(false);

  if (env.TURNSTILE_SECRET) {
    const passed = await verifyTurnstile(env.TURNSTILE_SECRET, get('cf-turnstile-response'), request);
    if (!passed) return done(false);
  }

  // Save first, so a submission is never lost even if the email fails.
  let savedId = null;
  if (env.DB) {
    try {
      const fields = Object.fromEntries(FIELDS.map(([key]) => [key, get(key)]));
      savedId = await saveSubmission(env.DB, fields, {
        page: request.headers.get('Referer'),
        country: request.cf?.country,
      });
    } catch (err) {
      console.error('Saving the submission to D1 failed:', err);
    }
  } else {
    console.error('DB (D1) binding missing: submission not saved.');
  }

  const emailed = await sendEmail(request, env, get, email);
  if (emailed && savedId !== null) {
    try {
      await markEmailed(env.DB, savedId);
    } catch (err) {
      console.error('Marking the submission as emailed failed:', err);
    }
  }

  // The visitor sees success if the lead reached Shane by at least one route.
  if (emailed || savedId !== null) return done(true);
  return done(false, 502);
}

/** Emails the submission. Returns true when Cloudflare accepted the message. */
async function sendEmail(request, env, get, email) {
  if (!env.CONTACT_EMAIL || !env.MAIL_TO || !env.MAIL_FROM) {
    console.error('Contact email is not configured: CONTACT_EMAIL binding, MAIL_TO or MAIL_FROM missing.');
    return false;
  }

  const body = FIELDS.map(([key, label]) => `${label}: ${get(key) || '-'}`).join('\n\n');
  const raw = buildEmail({
    from: env.MAIL_FROM,
    to: env.MAIL_TO,
    replyTo: email,
    subject: 'New Contact Form Inquiry from PartnerPress',
    body: `${body}\n\nSent from ${request.headers.get('Referer') ?? 'partnerpress.net'}\n`,
  });

  try {
    await env.CONTACT_EMAIL.send(new EmailMessage(env.MAIL_FROM, env.MAIL_TO, raw));
    return true;
  } catch (err) {
    console.error('Contact form email failed:', err);
    return false;
  }
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
