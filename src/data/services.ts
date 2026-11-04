import type { IconName } from '@/components/Icon.astro';

export interface Service {
  key: 'web-design' | 'care' | 'local-seo' | 'google-ads';
  title: string;
  shortTitle: string;
  summary: string;
  price: string;
  priceNote?: string;
  href: string;
  icon: IconName;
}

export const SERVICES: Service[] = [
  {
    key: 'web-design',
    title: 'Web design and development',
    shortTitle: 'Web Design',
    summary: 'Fast, secure, accessible sites built to turn visitors into calls. New sites, redesigns and migrations.',
    price: 'From [PRICE]',
    href: '/web-design/',
    icon: 'layout',
  },
  {
    key: 'care',
    title: 'WordPress care plans',
    shortTitle: 'WordPress Care Plans',
    summary: 'Weekly updates, daily security scans, backups, uptime monitoring and unlimited quick fixes.',
    price: 'From $249/month',
    href: '/wordpress-care-plans/',
    icon: 'shield',
  },
  {
    key: 'local-seo',
    title: 'Local SEO',
    shortTitle: 'Local SEO',
    summary: 'Rank in the map pack and local results. Google Business Profile, reviews, content and technical SEO.',
    price: 'From $1,495/month',
    href: '/local-seo/',
    icon: 'pin',
  },
  {
    key: 'google-ads',
    title: 'Google Ads management',
    shortTitle: 'Google Ads',
    summary: 'Get to the top of Google while SEO builds. Tight local targeting, call tracking and monthly reporting.',
    price: '[FLAT FEE]/month',
    priceNote: 'No contract',
    href: '/google-ads/',
    icon: 'megaphone',
  },
];

export const CLIENTS = ['Sutter Health', 'Grifols', 'Ghilotti Bros.', 'QuinStreet', 'Marin School of the Arts'];
