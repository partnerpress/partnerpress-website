export interface Faq {
  q: string;
  a: string;
}

export const CARE_FAQS: Faq[] = [
  {
    q: 'What if my site gets hacked?',
    a: 'I scan daily and fix issues as soon as they appear. If a site is compromised, I clean it and restore from a recent backup.',
  },
  { q: 'Can I change plans later?', a: "Yes. Upgrade or downgrade any time and I'll prorate the difference." },
  { q: 'Do you offer discounts for multiple sites?', a: "Yes. Get in touch and I'll put together a custom plan." },
  {
    q: "What isn't a quick fix?",
    a: "Redesigns and new features such as eCommerce, memberships or a learning platform. I'll send an estimate for those first.",
  },
  {
    q: 'What is AI visibility?',
    a: "It's whether AI tools like ChatGPT, Gemini and Google's AI answers mention your business when someone asks for a service you offer. It works differently from a regular Google ranking. A business can rank well on Google and still be left out of AI answers.",
  },
  {
    q: "Why can't I just turn on automatic updates?",
    a: 'In April 2026, attackers hid malicious code in 31 WordPress plugins and reached more than 20,000 sites through routine updates. WordPress now holds plugin updates for 24 hours before they go out. I go a step further: updates are tested before they reach your site, and if anything breaks, your site is rolled back to the last good version.',
  },
  {
    q: 'Do you use AI on my website?',
    a: 'Yes, behind the scenes, to work faster and catch problems sooner. A person reviews every change before it goes live, and your data is never used to train AI models.',
  },
  {
    q: 'What if I want to move to Wix, Lovable or another builder?',
    a: "Talk to me first. Moving can cost you years of Google rankings if it isn't done carefully. I'll tell you honestly what you'd gain and lose, and I can review your new site before it launches.",
  },
];

export const SEO_FAQS: Faq[] = [
  {
    q: 'How long until I see results?',
    a: 'Google Business Profile fixes can show up within weeks. New pages and rankings usually take 3 to 6 months. If you need calls sooner, pair SEO with Google Ads.',
  },
  {
    q: 'Is there a contract?',
    a: "Every plan starts with a 3-month first term, then runs month to month. To cancel, give 30 days' written notice.",
  },
  {
    q: 'Are there setup fees or other costs?',
    a: 'There is a one-time setup fee: $995 for your first location and $295 for each added location. It covers the audit, listing cleanup, baseline rank and AI scans, and tracking setup. Larger jobs like a full citation cleanup or reporting spam listings are quoted separately as project work.',
  },
  {
    q: 'Do you guarantee rankings or AI mentions?',
    a: "No. Nobody controls Google or AI answers, so anyone who guarantees a ranking is guessing. What I can promise is the work: every month you'll see exactly what I did and what moved.",
  },
  {
    q: 'Some services offer more pages for less. Why choose you?',
    a: 'Content is only one part of ranking. You also get a strategy built for your market, care for your website, a monthly AI Insight Brief and direct access to me, the person doing the work.',
  },
  {
    q: 'Why is website maintenance included?',
    a: 'A slow, broken or hacked site undoes SEO work. Including site care keeps the foundation solid.',
  },
  {
    q: 'My site is on WordPress. Is that a problem?',
    a: "Not at first. I'll get it fast and stable with a care plan. If plugin bloat, slow pages or security issues keep undercutting results, I'll recommend moving it to Astro, a faster and more secure platform.",
  },
  {
    q: "My site isn't on WordPress. Can you still help?",
    a: 'Yes. Google Business Profile and review work fit any platform. If the site itself is holding rankings back, I can rebuild it in Astro with your content carried over.',
  },
];

export const ADS_FAQS: Faq[] = [
  {
    q: 'How much should I spend on ads?',
    a: "It depends on your service and area. On the free call I'll estimate click costs for your top keywords and recommend a starting budget.",
  },
  {
    q: 'Who owns the Google Ads account?',
    a: 'You do. If we stop working together, the account, campaigns and history stay with you.',
  },
  { q: 'Is there a contract?', a: 'No. Management is month to month.' },
  {
    q: 'Do you also run Local Services Ads?',
    a: '[Yes / No. If yes: For eligible trades I can set up Google Local Services Ads, the "Google Guaranteed" listings above the regular ads.]',
  },
];

export const WEB_DESIGN_FAQS: Faq[] = [
  {
    q: 'Will a redesign hurt my Google rankings?',
    a: "Not if it's done carefully. I map every old URL to its new page and watch Search Console after launch.",
  },
  {
    q: 'Do you write the content?',
    a: '[Yes, copywriting is included / available as an add-on / You provide content and I edit it for the web.]',
  },
  {
    q: 'What do you build sites with?',
    a: "Astro, a modern framework that serves pages as plain, pre-built files. No database, no plugins to patch, nothing for hackers to log in to, and pages that load fast on any phone.",
  },
  {
    q: 'Do you still build on WordPress?',
    a: "For most local businesses I recommend Astro instead. If you already have a WordPress site you're happy with, a care plan keeps it fast, secure and up to date.",
  },
  {
    q: 'Who hosts the site?',
    a: "Astro sites run on Cloudflare's global network, set up in your name. Hosting is fast, secure and usually costs less than managed WordPress hosting.",
  },
  {
    q: 'Can I update the site myself?',
    a: 'Yes. You get a simple editor for text, photos and posts, a walkthrough at launch, and you can always send changes to me instead.',
  },
];
