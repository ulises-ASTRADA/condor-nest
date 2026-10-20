export const SITE = 'https://condor-nest.lat';
// Shared og:site_name / og:locale: a page-level openGraph object replaces the layout's, so every page spreads this in.
export const OG_BASE = { siteName: 'Condor Nest', locale: 'es_AR' } as const;
export const OG_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: 'Condor Nest · Hackathons, bounties y grants para builders LatAm' };
