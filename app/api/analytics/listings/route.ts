import { NextResponse } from 'next/server';
import { analyticsBot, analyticsEnabled, listingEvents } from '@/lib/listing-analytics';
import { rateLimit } from '@/lib/rate-limit';
import { serverRpc } from '@/lib/server-supabase';
import { FEATURED_ORDER } from '@/lib/featured';

const reply = (status: number) => new NextResponse(null, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(req: Request) {
  // Explicitly disabled on localhost/previews, even if production Supabase credentials are present.
  if (!analyticsEnabled(process.env)) return reply(204);
  // Next dev may normalize req.url to localhost while the browser used 127.0.0.1.
  // The Host header represents the actual requested authority in that case.
  const origin = req.headers.get('origin');
  let sameOrigin = false;
  try { const u = new URL(origin ?? ''); sameOrigin = u.host === req.headers.get('host') && u.protocol === new URL(req.url).protocol; } catch {}
  if (!sameOrigin) return reply(403);
  if (analyticsBot(req.headers.get('user-agent') ?? '') || req.headers.get('sec-fetch-site') === 'cross-site') return reply(204);
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (!rateLimit(`listing-analytics:${ip}`, 120, 60_000)) return reply(429);
  if (Number(req.headers.get('content-length')) > 16_384) return reply(413);
  const raw = await req.text();
  if (raw.length > 16_384) return reply(413);
  let events;
  try { events = listingEvents(JSON.parse(raw)?.events); } catch { return reply(400); }
  if (!events) return reply(400);
  try { await serverRpc('cn_record_listing_events', { p_events: events, p_editorial_slugs: [...FEATURED_ORDER] }); return reply(204); }
  catch { console.warn('listing analytics: write failed'); return reply(503); }
}
