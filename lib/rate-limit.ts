// Simple in-memory fixed-window limiter. LIMITATION: per serverless instance only (resets on cold start,
// not shared across regions/instances). For a global limit use Upstash Redis or a Vercel Firewall rate-limit rule.
const hits = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, max = 5, windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return true; }
  return ++h.n <= max;
}
