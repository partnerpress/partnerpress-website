// Marin town pages. Only towns with real search demand get a page, and each one
// carries its own local detail so it reads as a page about that town, not a template.
import type { ImageMetadata } from 'astro';
import type { Faq } from '@/data/faqs';
import missionSanRafael from '@/assets/img/locations/marin-mission-san-rafael.jpg';
import novatoCityHall from '@/assets/img/locations/novato-old-city-hall.jpg';

export interface Town {
  slug: string;
  name: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  lead: string;
  hero?: ImageMetadata;
  heroPosition?: string;
  /** Short paragraphs about doing business in this town. */
  intro: { title: string; text: string }[];
  neighborhoods: string[];
  neighborhoodsNote: string;
  faqs: Faq[];
  /** Short teaser used on the Marin County hub. */
  teaser: string;
}

export const TOWNS: Town[] = [
  {
    slug: 'san-rafael',
    name: 'San Rafael',
    title: 'San Rafael Web Design & Local SEO | PartnerPress',
    description:
      'WordPress web design and local SEO for San Rafael businesses, from downtown Fourth Street to Terra Linda. Marin-based since 2010. Call (415) 390-6563.',
    eyebrow: 'San Rafael, CA · 15 minutes from my Novato office',
    h1: 'Web design and local SEO for San Rafael businesses',
    lead: 'San Rafael is Marin’s county seat and its busiest business hub. I help the firms, shops and service companies here win the local searches that matter, with websites that turn those visits into calls.',
    hero: missionSanRafael,
    intro: [
      {
        title: 'Marin’s professional center',
        text: 'With the county courthouse at the Civic Center and offices lining downtown, San Rafael has more attorneys, accountants, advisors and medical practices than anywhere else in Marin. Searchers compare several sites before they call, so clear credentials and an easy first step matter.',
      },
      {
        title: 'A crowded map pack',
        text: 'Searches for "san rafael web design" and similar terms show a map pack, which means Google favors businesses with complete, well-reviewed profiles close to the searcher. Getting a San Rafael business into those three spots is usually the fastest win.',
      },
      {
        title: 'North and south of the city',
        text: 'Terra Linda and Lucas Valley to the north and Gerstle Park and Bret Harte to the south search like separate towns. Pages and profiles that mention the neighborhoods you actually serve help you show up across all of them.',
      },
    ],
    neighborhoods: [
      'Downtown and Fourth Street',
      'Terra Linda',
      'Lucas Valley',
      'Marinwood',
      'Gerstle Park',
      'Dominican',
      'Glenwood',
      'Peacock Gap',
      'Bret Harte',
      'Canal',
    ],
    neighborhoodsNote: 'Happy to meet at your office or a café downtown.',
    faqs: [
      {
        q: 'Do you have an office in San Rafael?',
        a: 'My office is in Novato, about 15 minutes north on 101. I meet San Rafael clients at their office, downtown, or on a video call.',
      },
      {
        q: 'Can you help a San Rafael business show up in nearby towns too?',
        a: 'Yes. San Rafael businesses often serve Larkspur, San Anselmo and Novato as well. I plan pages and your Google Business Profile service area around the towns you actually work in.',
      },
      {
        q: 'Do you work with San Rafael nonprofits?',
        a: 'Yes. I’ve built and cared for sites for Marin nonprofits and schools for years, and I keep pricing practical for mission-driven budgets.',
      },
    ],
    teaser: 'Marin’s county seat, with the most competitive map pack in the county.',
  },
  {
    slug: 'novato',
    name: 'Novato',
    title: 'Novato Web Design & Local SEO | PartnerPress',
    description:
      'Novato-based WordPress web design and local SEO for Novato businesses, from Old Town to Hamilton and Bel Marin Keys. In-person meetings. Call (415) 390-6563.',
    eyebrow: 'Novato, CA · My home base',
    h1: 'Novato web design and local SEO from a Novato neighbor',
    hero: novatoCityHall,
    heroPosition: '75% 72%',
    lead: 'PartnerPress is based in Novato. I help local businesses here get found on Google and turn those searches into calls, and we can meet in person whenever you like.',
    intro: [
      {
        title: 'Marin’s northern gateway',
        text: 'Novato sits where Highway 101 meets Highway 37, so many Novato businesses draw customers from Petaluma and southern Sonoma as well as Marin. Your site and Google profile should reflect both sides of the county line.',
      },
      {
        title: 'Old Town and beyond',
        text: 'From the shops on Grant Avenue to the offices and studios at Hamilton, Novato’s businesses are spread out. Clear directions, parking notes and a service area that names the neighborhoods you cover make it easy for customers to choose you.',
      },
      {
        title: 'Less competition, more opportunity',
        text: 'Fewer agencies focus on Novato than on San Rafael or Mill Valley. A well-built site and an active Google Business Profile can move a Novato business into the map pack faster than in the southern towns.',
      },
    ],
    neighborhoods: [
      'Old Town',
      'Hamilton',
      'Bel Marin Keys',
      'Ignacio',
      'San Marin',
      'Indian Valley',
      'Black Point',
      'Pacheco Valley',
      'Rowland',
    ],
    neighborhoodsNote: 'We can meet at your business, in Old Town, or anywhere in town.',
    faqs: [
      {
        q: 'Can we meet in person in Novato?',
        a: 'Yes. I live and work in Novato, so meeting at your business or for coffee in Old Town is easy. Video calls are always an option too.',
      },
      {
        q: 'My customers come from Petaluma too. Can you help with that?',
        a: 'Yes. I can build pages and set your Google Business Profile service area to cover southern Sonoma as well as Marin, and track how you rank in both.',
      },
      {
        q: 'Do you only work with Novato businesses?',
        a: 'No. Novato is home, but I work with businesses across Marin and the rest of the U.S.',
      },
    ],
    teaser: 'My home base, where Marin meets southern Sonoma.',
  },
];
