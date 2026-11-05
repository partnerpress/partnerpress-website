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

const SEO_TABLE: [string, ...Cell[]][] = [
  ['Locations', '1 location', '2 locations', '3 locations'],
  ['New content', '1 new page of content each month', '2 new pages of content each month', '3 new pages of content each month'],
  ['SEO roadmap and keyword optimization', true, true, true],
  ['Google Business Profile management', true, true, true],
  ['Weekly technical SEO', true, true, true],
  ['Review and backlink monitoring', true, true, true],
  ['Monthly report, quarterly meeting', true, true, true],
  ['Site care included (WordPress or Astro)', true, true, true],
];

export const SEO_PLANS: Plan[] = [
  {
    name: 'County',
    price: 1495,
    tagline: 'Improve Local Visibility',
    bestFor: 'One location competing in its own town and county.',
    featured: true,
    badge: 'Most local businesses',
    rows: buildRows(SEO_TABLE, 0),
  },
  {
    name: 'Region',
    price: 3995,
    tagline: 'Boost Countywide Visibility',
    bestFor: 'Two locations, or one business serving several towns.',
    rows: buildRows(SEO_TABLE, 1),
  },
  {
    name: 'State',
    price: 4995,
    tagline: 'Maximize Service Area Visibility',
    bestFor: 'Three locations, or a wide service area across the state.',
    rows: buildRows(SEO_TABLE, 2),
  },
];
