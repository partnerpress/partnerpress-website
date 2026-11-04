// Business details used across the site. Change a phone number or address here
// and every page, the footer, the call bar and the schema markup update together.

export const SITE = {
  name: 'PartnerPress',
  legalName: 'PartnerPress, LLC',
  url: 'https://partnerpress.net',
  owner: 'Shane Barnes',
  founded: 2010,
  tagline: 'WordPress, Local SEO and Google Ads for local service businesses across the U.S.',
  hours: 'Monday to Friday, 9:00 am to 5:00 pm',
  hoursSchema: 'Mo-Fr 09:00-17:00',
  reviews: { rating: '5.0', count: 19 },
};

export type OfficeKey = 'marin' | 'nm';

export interface Office {
  key: OfficeKey;
  name: string;
  short: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  phone: string;
  tel: string;
  page: string;
  areaServed: string;
  /** Local service pages listed under this office in the footer. */
  links?: { label: string; href: string }[];
}

export const OFFICES: Record<OfficeKey, Office> = {
  marin: {
    key: 'marin',
    name: 'Marin County, CA',
    short: 'Marin',
    street: '309 Verandah Ave',
    city: 'Novato',
    region: 'CA',
    postalCode: '94945',
    phone: '(415) 390-6563',
    tel: '+14153906563',
    page: '/marin-county/',
    areaServed: 'Marin County, CA',
    links: [
      { label: 'Marin web design', href: '/marin-county/web-design/' },
      { label: 'Marin SEO', href: '/marin-county/seo/' },
    ],
  },
  nm: {
    key: 'nm',
    name: 'Las Cruces, NM',
    short: 'Las Cruces',
    street: '3749 Golden Echo Loop',
    city: 'Las Cruces',
    region: 'NM',
    postalCode: '88012',
    phone: '(575) 517-4795',
    tel: '+15755174795',
    page: '/las-cruces/',
    areaServed: 'Doña Ana County, NM',
  },
};

export type NavKey = 'web-design' | 'care' | 'local-seo' | 'google-ads' | 'locations' | 'about' | 'contact' | 'blog';

export const SERVICE_NAV: { key: NavKey; label: string; mobileLabel?: string; href: string }[] = [
  { key: 'web-design', label: 'Web Design', href: '/wordpress-web-design/' },
  { key: 'care', label: 'WordPress Care', mobileLabel: 'WordPress Care Plans', href: '/wordpress-care-plans/' },
  { key: 'local-seo', label: 'Local SEO', href: '/local-seo/' },
  { key: 'google-ads', label: 'Google Ads', href: '/google-ads/' },
];

export const SECONDARY_NAV: { key: NavKey; label: string; href: string }[] = [
  { key: 'about', label: 'About', href: '/about/' },
  { key: 'blog', label: 'Blog', href: '/blog/' },
  { key: 'contact', label: 'Contact', href: '/contact/' },
];

export const LEGAL_NAV = [
  { label: 'Privacy', href: '/privacy-policy/' },
  { label: 'Terms', href: '/terms-conditions/' },
  { label: 'Cookies', href: '/cookie-policy/' },
  { label: 'Disclaimer', href: '/disclaimer/' },
  { label: 'Accessibility', href: '/accessibility-statement/' },
];

/** Google Analytics 4 measurement ID. Set PUBLIC_GA4_ID in the Cloudflare Worker's build variables to turn tracking on. */
export const GA4_ID = import.meta.env.PUBLIC_GA4_ID ?? '';

/** Cloudflare Turnstile site key for the contact form. Set PUBLIC_TURNSTILE_SITE_KEY in the Worker's build variables to show the widget. */
export const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '';

/** Trustindex widget that shows live Google reviews. */
export const TRUSTINDEX_SRC = 'https://cdn.trustindex.io/loader.js?6f1c3fd8962b091656596eaf64';
