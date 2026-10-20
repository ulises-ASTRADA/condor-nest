import type { MetadataRoute } from 'next';
import { getListings, lastIngest } from '@/lib/supabase';
import { SITE } from '@/lib/site';
import { HUBS } from '@/lib/hubs';
// Same cadence as the pages it lists: getListings() is cached 300s under tag 'listings',
// and the ingest cron calls revalidateTag('listings'), so new/updated listings show up here too.
export const revalidate = 300;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // getListings() applies the site's public filter (in_latam=true, also enforced by RLS),
  // so every /o/<slug> that renders is included and non-public rows (e.g. global dp-* Devpost) are not.
  // /api and /newsletter are intentionally left out (robots.txt disallows them).
  const [listings, ingest] = await Promise.all([getListings(), lastIngest()]);
  const fresh = ingest ? new Date(ingest) : new Date();
  const seen = new Set<string>();
  const pages = listings.filter((l) => l.slug && !seen.has(l.slug) && seen.add(l.slug));
  return [
    { url: SITE, lastModified: fresh, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/acerca`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/publicar`, changeFrequency: 'monthly', priority: 0.3 },
    ...HUBS.map((h) => ({ url: `${SITE}/${h.slug}`, lastModified: fresh, changeFrequency: 'daily' as const, priority: 0.9 })),
    ...pages.map((l) => ({ url: `${SITE}/o/${encodeURIComponent(l.slug)}`, lastModified: new Date(l.updatedAt || l.createdAt), changeFrequency: 'daily' as const, priority: 0.8 })),
  ];
}
