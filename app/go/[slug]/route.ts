import { after, NextResponse, type NextRequest } from 'next/server';
import { getListing } from '@/lib/supabase';
import { serverRpc } from '@/lib/server-supabase';
import { VALID_SLUG, goFallback, refPath } from '@/lib/go';

// /go/<slug> → 302 to the listing's stored apply_url (never a user-supplied URL), counting the click.
// What counts as a click (documented for analytics):
//   - GET only (HEAD is redirected but never counted).
//   - Not a prefetch/prerender (Purpose / Sec-Purpose / X-Purpose / X-Moz: prefetch).
//   - Not a known bot/crawler/tool; the User-Agent is checked in memory only and NEVER stored.
//   - Not a repeat: a first-party cookie per listing (value "1", no identifier, 30 min, Path=/go/) marks
//     that this browser was already counted; repeats within the window redirect but are not inserted.
// Stored per click: listing id + slug, timestamp, referrer hostname, and the condor-nest page PATH the click came from
// (only when the Referer is this site; pathname only, no query). No IP, no UA, no cookie value.
// Unknown slug or no apply_url: 302 to same-origin /o/<slug> if that page exists, else / (never off-site, never counted).
// Malformed slug: 400.
export const dynamic = 'force-dynamic';

const WINDOW_S = 30 * 60;
const BOT = /bot|crawl|spider|slurp|scrap|preview|facebookexternalhit|embedly|quora link|whatsapp|telegram|discord|slack|vkshare|w3c_validator|lighthouse|pagespeed|headless|phantom|puppeteer|playwright|selenium|curl|wget|httpie|python|java\/|go-http|okhttp|axios|node-fetch|undici|libwww|feed|monitor|uptime|pingdom|checker|validator|archive|ahrefs|semrush|mj12|dotbot|bytespider|petalbot|google-|-google|googleother|applebot|gptbot|chatgpt|oai-search|claude|anthropic|perplexity|cohere|ccbot/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const baseHeaders = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  // The external site gets no referrer (same as the old rel="noreferrer" direct link).
  'Referrer-Policy': 'no-referrer',
};

function isPrefetch(req: NextRequest) {
  const p = [req.headers.get('purpose'), req.headers.get('sec-purpose'), req.headers.get('x-purpose'), req.headers.get('x-moz')].join(' ').toLowerCase();
  return /prefetch|prerender|preview/.test(p) || req.headers.get('next-router-prefetch') !== null;
}
function refDomain(req: NextRequest): string | null {
  const r = req.headers.get('referer');
  if (!r) return null;
  try { const u = new URL(r); return /^https?:$/.test(u.protocol) ? u.hostname.toLowerCase().replace(/^www\./, '').slice(0, 253) : null; } catch { return null; }
}

async function handle(req: NextRequest, slug: string, count: boolean) {
  if (!VALID_SLUG.test(slug)) {
    return new NextResponse('Solicitud inválida', { status: 400, headers: { ...baseHeaders, 'content-type': 'text/plain; charset=utf-8' } });
  }
  const l = await getListing(slug).catch(() => null);
  if (!l || !l.applyUrl || !UUID.test(l.id)) {
    // Relative Location: always same-origin. Nothing is recorded.
    return new NextResponse(null, { status: 302, headers: { ...baseHeaders, Location: goFallback(slug, !!l) } });
  }
  const res = new NextResponse(null, { status: 302, headers: { ...baseHeaders, Location: l.applyUrl } });
  const cookie = `cng_${l.id.replace(/-/g, '')}`;
  const ua = req.headers.get('user-agent') ?? '';
  const counted = count && !isPrefetch(req) && ua.length > 0 && !BOT.test(ua) && !req.cookies.has(cookie);
  if (counted) {
    res.cookies.set(cookie, '1', { httpOnly: true, secure: true, sameSite: 'lax', path: '/go/', maxAge: WINDOW_S });
    const ref = refDomain(req);
    const path = refPath(req.headers.get('referer'), req.headers.get('host'));
    // Non-blocking: runs after the redirect is sent; failures never affect the user.
    after(async () => {
      try { await serverRpc('cn_record_click', { p_listing: l.id, p_ref: ref, p_path: path }); }
      catch (e) { console.warn('cn_record_click failed', (e as Error).message); }
    });
  }
  return res;
}

type P = { params: Promise<{ slug: string }> };
export async function GET(req: NextRequest, { params }: P) { return handle(req, (await params).slug, true); }
export async function HEAD(req: NextRequest, { params }: P) { return handle(req, (await params).slug, false); }
