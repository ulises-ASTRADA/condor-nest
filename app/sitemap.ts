import type { MetadataRoute } from 'next';
import { getListings, lastIngest } from '@/lib/supabase';
import { SITE } from '@/lib/site';
import { HUBS } from '@/lib/hubs';
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, ingest] = await Promise.all([getListings(), lastIngest()]);
  const fresh = ingest ? new Date(ingest) : new Date();
  return [
    { url: SITE, lastModified: fresh, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/acerca`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/publicar`, changeFrequency: 'monthly', priority: 0.3 },
    ...HUBS.map((h) => ({ url: `${SITE}/${h.slug}`, lastModified: fresh, changeFrequency: 'daily' as const, priority: 0.9 })),
    ...listings.map((l) => ({ url: `${SITE}/o/${l.slug}`, lastModified: new Date(l.updatedAt || l.createdAt), changeFrequency: 'daily' as const, priority: 0.8 })),
  ];
}
