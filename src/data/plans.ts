export interface PlanRow {
  label: string;
  /** False shows a red x and strikes the row through. */
  included: boolean;
}

export interface Plan {
  name: string;
  /** Monthly price in US dollars. */
  price: number;
  /** Short headline under the price, e.g. "Stay Alive Online". */
  tagline: string;
  bestFor: string;
  featured?: boolean;
  badge?: string;
  /** One-time setup fee shown under the price, e.g. "+ $995 one-time setup". */
  setup?: string;
  /** Button label; defaults to "Choose {name}". */
  cta?: string;
  /** Full comparison list. Every plan in a group lists the same rows in the same order. */
  rows: PlanRow[];
}

/**
 * Builds each plan's comparison rows from one shared table.
 * A row is a single label (true/false per plan) or one label per plan (null = not included).
 */
type Cell = boolean | string | null;
function buildRows(table: [string, ...Cell[]][], index: number): PlanRow[] {
  return table.map(([label, ...cells]) => {
    const cell = cells[index];
    if (typeof cell === 'string') return { label: cell, included: true };
    return { label, included: cell === true };
  });
}

/** Daily cost shown under the monthly price, e.g. "$8.19". */
export function perDay(monthly: number): string {
  return `$${((monthly * 12) / 365).toFixed(2)}`;
}

export function formatPrice(monthly: number): string {
  return `$${monthly.toLocaleString('en-US')}`;
}

// Rows match the production comparison tables: one shared list, checks or x per plan.
const CARE_TABLE: [string, ...Cell[]][] = [
  ['Weekly WordPress updates', true, true, true],
  ['Remote backups', 'Weekly remote backups', 'Hourly remote backups', 'Hourly remote backups'],
  ['Daily security scanning', true, true, true],
  ['Load time optimization', true, true, true],
  ['Uptime monitoring', true, true, true],
  ['Keyword tracking', 'Keyword tracking (3 keywords)', 'Keyword tracking (5 keywords)', 'Keyword tracking (10 keywords)'],
  ['Broken link monitoring and repair', true, true, true],
  ['Quality testing', 'Weekly quality testing', 'Daily quality testing', 'Daily quality testing'],
  ['Spam filtering', true, true, true],
  ['Premium plugin library', true, true, true],
  ['Unlimited quick fixes', true, true, true],
  ['Monthly maintenance report', true, true, true],
  ['Website firewall', false, true, true],
  ['Hosting and domain administration', false, true, true],
  ['Privacy policy compliance monitoring', false, true, true],
  ['Accessibility monitoring', false, true, true],
  ['Advanced maintenance for eCommerce, courses and memberships', false, false, true],
  ['Monthly SEO readiness fixes', false, false, true],
  ['Priority support', false, false, true],
];

export const CARE_PLANS: Plan[] = [
  {
    name: 'Survive',
    price: 249,
    tagline: 'Stay Alive Online',
    bestFor: 'For a simple brochure site that needs to stay safe and current.',
    rows: buildRows(CARE_TABLE, 0),
  },
  {
    name: 'Strive',
    price: 399,
    tagline: 'Improve User Experience',
    bestFor: 'For businesses that rely on their site for leads and need compliance covered.',
    featured: true,
    badge: 'Most popular',
    rows: buildRows(CARE_TABLE, 1),
  },
  {
    name: 'Arrive',
    price: 499,
    tagline: 'Achieve Search Readiness',
    bestFor: 'For stores, memberships, or sites getting ready for an SEO campaign.',
    rows: buildRows(CARE_TABLE, 2),
  },
];

// Local SEO is priced per location (pricing refresh, 2026-11-05): a full first location, then cheaper
// add-ons, because strategy, reporting and site care barely change as locations are added.
const included = (labels: string[]): PlanRow[] => labels.map((label) => ({ label, included: true }));

export const SEO_FIRST_LOCATION = 1495;
export const SEO_ADDED_LOCATION = 995;

export const SEO_PLANS: Plan[] = [
  {
    name: 'First location',
    price: SEO_FIRST_LOCATION,
    tagline: 'Everything to rank one location',
    bestFor: 'Strategy, content, AI tracking and site care for your main location.',
    featured: true,
    badge: 'Start here',
    setup: '+ $995 one-time setup',
    cta: 'Get started',
    rows: included([
      '1 location',
      '1 new page of content each month',
      'SEO roadmap and keyword optimization',
      'Google Business Profile management',
      'AI search tracking (ChatGPT, Google AI Overviews, AI Mode, Gemini)',
      'Monthly AI Insight Brief',
      'Weekly technical SEO',
      'Review and backlink monitoring',
      'Quarterly strategy meeting',
      'Site care included (WordPress or Astro)',
      'Direct access to me, not an account manager',
    ]),
  },
  {
    name: 'Added location',
    price: SEO_ADDED_LOCATION,
    tagline: 'Each extra location',
    bestFor: 'A second office, shop or branch with its own Google Business Profile.',
    setup: '+ $295 one-time setup',
    cta: 'Add locations',
    rows: included([
      'Google Business Profile and listing management',
      'Its own location page',
      'Map rank and AI search tracking',
      'Review monitoring for that location',
      'Its own monthly AI Insight Brief',
    ]),
  },
  {
    name: 'Added city',
    price: 495,
    tagline: 'Each extra target city',
    bestFor: 'One location that wants to reach a nearby city where it has no office.',
    cta: 'Add a city',
    rows: included(['Rank tracking for that city', 'One new service area page each month']),
  },
];

/** Monthly total for a number of locations: the first at full price, the rest as added locations. */
export function seoTotal(locations: number): number {
  return SEO_FIRST_LOCATION + SEO_ADDED_LOCATION * (locations - 1);
}
