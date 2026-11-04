export interface Plan {
  name: string;
  /** Monthly price in US dollars. */
  price: number;
  bestFor: string;
  featured?: boolean;
  badge?: string;
  /** Shown above the list when a plan builds on the previous one. */
  includesPrevious?: string;
  features: string[];
}

/** Daily cost shown under the monthly price, e.g. "$8.19". */
export function perDay(monthly: number): string {
  return `$${((monthly * 12) / 365).toFixed(2)}`;
}

export function formatPrice(monthly: number): string {
  return `$${monthly.toLocaleString('en-US')}`;
}

export const CARE_PLANS: Plan[] = [
  {
    name: 'Survive',
    price: 249,
    bestFor: 'Best for a simple brochure site that needs to stay safe and current.',
    features: [
      'Weekly WordPress updates',
      'Weekly remote backups',
      'Daily security scanning',
      'Load time optimization',
      'Uptime monitoring',
      'Keyword tracking (3 keywords)',
      'Broken link monitoring and repair',
      'Weekly quality testing',
      'Spam filtering',
      'Premium plugin library',
      'Unlimited quick fixes',
      'Monthly maintenance report',
    ],
  },
  {
    name: 'Strive',
    price: 399,
    bestFor: 'Best for businesses that rely on their site for leads and need compliance covered.',
    featured: true,
    badge: 'Most popular',
    includesPrevious: 'Everything in Survive, plus:',
    features: [
      'Hourly remote backups',
      'Daily quality testing',
      'Keyword tracking (5 keywords)',
      'Hosting and domain administration',
      'Privacy policy compliance monitoring',
      'Accessibility monitoring',
    ],
  },
  {
    name: 'Arrive',
    price: 499,
    bestFor: 'Best for stores, memberships, or sites getting ready for an SEO campaign.',
    includesPrevious: 'Everything in Strive, plus:',
    features: [
      'Keyword tracking (10 keywords)',
      'Advanced maintenance for eCommerce, courses and memberships',
      'Monthly SEO readiness fixes',
      'Priority support',
    ],
  },
];

export const SEO_PLANS: Plan[] = [
  {
    name: 'County',
    price: 1495,
    bestFor: 'One location competing in its own town and county.',
    featured: true,
    badge: 'Most local businesses',
    features: [
      '1 location',
      '1 new page of content each month',
      'SEO roadmap and keyword optimization',
      'Google Business Profile management',
      'Weekly technical SEO',
      'Review and backlink monitoring',
      'Monthly report, quarterly meeting',
      'Site care included (WordPress or Astro)',
    ],
  },
  {
    name: 'Region',
    price: 3995,
    bestFor: 'Two locations, or one business serving several towns.',
    includesPrevious: 'Everything in County, plus:',
    features: ['2 locations', '2 new pages of content each month'],
  },
  {
    name: 'State',
    price: 4995,
    bestFor: 'Three locations, or a wide service area across the state.',
    includesPrevious: 'Everything in Region, plus:',
    features: ['3 locations', '3 new pages of content each month'],
  },
];
