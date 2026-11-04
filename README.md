# PartnerPress website

The partnerpress.net site, built with [Astro](https://astro.build) as a static site and hosted on Cloudflare Workers (static assets).

## Run it locally

Needs Node 22.23.4 or newer (Node 24 recommended).

```bash
npm install
npm run dev      # local server with live reload at http://localhost:4321
npm run build    # production build into dist/
npm run preview  # serve the built dist/ folder
npm run check    # type and template check
```

## Where things live

| What | Where |
| --- | --- |
| Business details (name, phones, addresses, hours, review count) | `src/config/site.ts` |
| Services, care plans, SEO plans | `src/data/services.ts`, `src/data/plans.ts` |
| Client reviews | `src/data/reviews.ts` |
| FAQs | `src/data/faqs.ts` |
| Towns and service areas | `src/data/locations.ts` |
| Blog posts | `src/content/blog/*.md` |
| Legal pages | `src/content/legal/*.md` |
| Pages | `src/pages/` |
| Reusable building blocks | `src/components/` |
| Colors, fonts, spacing | `src/styles/global.css` |
| Logos, favicon, robots.txt, redirects | `public/` |

Change a price or phone number once in `src/config` or `src/data` and every page that shows it updates.

## Blog

Add a Markdown file to `src/content/blog/`. The file name becomes the URL, so `my-post.md` is published at `/blog/my-post/`.

```markdown
---
title: Post title
description: One or two sentences for search results and the blog index.
pubDate: 2026-10-28
tags: [wordpress]
draft: true
---

Post body in Markdown.
```

Set `draft: true` to keep a post off the live site. Drafts still show in `npm run dev` so you can preview them. Remove the line (or set it to `false`) to publish. Posts appear on `/blog/`, in the sitemap and in the RSS feed at `/rss.xml`.

## Environment variables (Cloudflare Worker build variables)

| Variable | Purpose |
| --- | --- |
| `PUBLIC_GA4_ID` | GA4 measurement ID (for example `G-XXXXXXX`). Analytics only load when this is set. |
| `PUBLIC_TURNSTILE_SITE_KEY` | Optional. Cloudflare Turnstile site key; shows the spam check on the contact form. |
| `SITE_INDEXABLE` | Set to `true` once partnerpress.net points at the Worker. Only `main` builds are then indexable. |

## Contact form

The form posts to `/api/contact`. `worker/index.js` checks it (honeypot, optional Turnstile) and emails it through Cloudflare Email Service (Email Sending) with the `send_email` binding, with Reply-To set to the visitor. Everything else is served straight from `dist/`.

Set these on the Worker (Settings > Variables and secrets, Production):

| Name | Type | Purpose |
| --- | --- | --- |
| `MAIL_TO` | Secret | Where submissions go. Must be a verified destination address (Email Service > Email Routing > Destination addresses). |
| `MAIL_FROM` | Secret | Sender address on the onboarded Email Sending domain, for example `website@partnerpress.net`. |
| `TURNSTILE_SECRET` | Secret | Optional. Turns on the Turnstile check (pair with `PUBLIC_TURNSTILE_SITE_KEY`). |

partnerpress.net mail runs on Google Workspace. Email Sending only adds records on `cf-bounce.partnerpress.net`, so it leaves the Google MX records alone. Do not onboard the domain to Email Routing (that needs Cloudflare MX on the apex), and keep the existing `_dmarc` record rather than adding a second one.

## Search engine visibility

Builds are noindex unless `SITE_INDEXABLE=true` and the branch is `main`. Every other build (preview branches, local builds) gets a `noindex` robots tag on every page and an `X-Robots-Tag: noindex, nofollow` header. The build log says which mode it used. The workers.dev address always sends `X-Robots-Tag: noindex` (see `public/_headers`).

## Deploying

Cloudflare Workers Builds is connected to GitHub and deploys `main`. It runs `npm run build` (Node 24, from `.node-version`), then `npx wrangler deploy`, which serves `dist/` as static assets (see `wrangler.jsonc`). Response headers live in `public/_headers`. Old WordPress URLs are redirected in `public/_redirects`.

## Before launch

- Replace every `[SQUARE BRACKET]` placeholder (highlighted in orange on the site).
- Paste the Termageddon embed code into each file in `src/content/legal/`.
- Add real photos and client screenshots where the placeholder boxes are.
- Review the blog post in `src/content/blog/`.
- Set `PUBLIC_GA4_ID` in the Worker's build variables.
- Turn on Turnstile for the contact form: create a Turnstile widget for partnerpress.net, set `PUBLIC_TURNSTILE_SITE_KEY` (build variable) and `TURNSTILE_SECRET` (runtime secret), then redeploy. Set both or neither: a secret without the site key rejects every submission.
- Optional: add a Cloudflare rate limiting rule for `POST /api/contact` (for example 5 requests per minute per IP).
- Add partnerpress.net as a custom domain on the Worker, set `SITE_INDEXABLE=true`, redeploy and confirm the build log says "search engines: allowed".
- Submit `https://partnerpress.net/sitemap-index.xml` in Google Search Console.
- HSTS: partnerpress.net is not on the browser preload list (checked 2026-11-04), so `public/_headers` leaves out `preload`. Only add it if you submit the domain at hstspreload.org.
