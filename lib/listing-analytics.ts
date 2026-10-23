/** Public, anonymous listing analytics. Never accept free text or private URL parameters. */
export const ANALYTICS_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ANALYTICS_SLUG = /^[A-Za-z0-9_-]{1,200}$/;
const PUBLIC_LISTS = new Set(['/', '/hackathons-argentina', '/hackathons-mexico', '/hackathons-chile', '/hackathons-ia', '/hackathons-online', '/bounties', '/grants']);
export const publicAnalyticsPath = (path: unknown): path is string => typeof path === 'string' && (PUBLIC_LISTS.has(path) || /^\/o\/[A-Za-z0-9_-]{1,200}$/.test(path));
export type CardPlacement = 'featured' | 'organic' | 'related';
export type ListingEvent = {
  id: string; kind: 'impression' | 'card_click' | 'detail_view'; slug: string;
  path: string; placement: CardPlacement | 'detail'; position: number | null; exposure: string | null;
};
export function listingEvents(input: unknown): ListingEvent[] | null {
  if (!Array.isArray(input) || input.length < 1 || input.length > 20) return null;
  const result: ListingEvent[] = [];
  for (const value of input) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const { id, kind, slug, path, placement, position, exposure } = value as Record<string, unknown>;
    if (typeof id !== 'string' || !ANALYTICS_UUID.test(id) || typeof slug !== 'string' || !ANALYTICS_SLUG.test(slug) || !publicAnalyticsPath(path)) return null;
    if (kind === 'detail_view') {
      if (path !== `/o/${slug}` || placement !== 'detail' || position !== null || !(exposure === null || typeof exposure === 'string' && ANALYTICS_UUID.test(exposure))) return null;
    } else {
      if (kind !== 'impression' && kind !== 'card_click') return null;
      if (typeof exposure !== 'string' || !ANALYTICS_UUID.test(exposure) || !Number.isInteger(position) || (position as number) < 1 || (position as number) > 500) return null;
      if (!['featured', 'organic', 'related'].includes(String(placement))) return null;
      if ((placement === 'featured' && path !== '/') || (placement === 'organic' && path.startsWith('/o/')) || (placement === 'related' && !path.startsWith('/o/'))) return null;
    }
    result.push({ id, kind, slug, path, placement, position, exposure } as ListingEvent);
  }
  return result;
}
/** Conservative tool filter. This is not proof of a human or protection against determined fraud. */
export const analyticsBot = (ua: string) => !ua || /bot|crawl|spider|scrap|preview|headless|phantom|puppeteer|playwright|selenium|curl|wget|python|node-fetch|undici|monitor|lighthouse|pagespeed|facebookexternalhit|whatsapp|telegram|discord|slack/i.test(ua);
export function analyticsEnabled(env: Record<string, string | undefined>) {
  return env.VERCEL_ENV === 'production' && env.LISTING_ANALYTICS_ENABLED === '1' && env.NEXT_PUBLIC_LISTING_ANALYTICS_ENABLED === '1';
}
