/** Canonical origin: https, no "www.", no trailing slash. Google indexed both www and bare URLs, so every canonical,
 *  og:url, sitemap, robots and JSON-LD URL is built from this one value. */
export function canonicalOrigin(raw: string | undefined | null, fallback = 'https://condor-nest.lat'): string {
  try {
    const u = new URL((raw ?? '').trim() || fallback);
    return `https://${u.host.replace(/^www\./i, '').toLowerCase()}`;
  } catch {
    return fallback;
  }
}
export const SITE = canonicalOrigin(process.env.SITE_URL);
// Shared og:site_name / og:locale: a page-level openGraph object replaces the layout's, so every page spreads this in.
export const OG_BASE = { siteName: 'Condor Nest', locale: 'es_AR' } as const;
export const OG_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: 'Condor Nest · Hackathons, bounties y grants para builders de LatAm' };
