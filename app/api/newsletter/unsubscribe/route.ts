import { NextResponse } from 'next/server';
import { serverRpc } from '@/lib/server-supabase';
import { rateLimit } from '@/lib/rate-limit';
import { isToken } from '@/lib/email';
import { sameOriginUrl } from '@/lib/same-origin';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' };
type R = 'ok' | 'invalido' | 'error';
async function unsubscribe(req: Request, token: unknown): Promise<R> {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (!rateLimit(`nlu:${ip}`, 20) || !isToken(token)) return 'invalido';
  try { return (await serverRpc('cn_unsubscribe', { unsub: token })) === 'unsubscribed' ? 'ok' : 'invalido'; } catch { return 'error'; }
}
// GET never unsubscribes (mail scanners prefetch links): it only forwards to the page with the "Darme de baja" button.
// Links in already-sent emails point here, so they keep working.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  return NextResponse.redirect(sameOriginUrl(req, '/newsletter/baja', { token: isToken(token) ? token : null }), { status: 303, headers: NO_STORE });
}
// POST unsubscribes. Two callers:
// - RFC 8058 one-click from mail clients: token in the URL, body "List-Unsubscribe=One-Click"; single step, status code only.
// - the /newsletter/baja form (works without JS): token in the body; redirects back to the page with the result.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const form = await req.formData().catch(() => null);
  if (form?.get('List-Unsubscribe') === 'One-Click') {
    const r = await unsubscribe(req, url.searchParams.get('token'));
    return new NextResponse(null, { status: r === 'ok' ? 200 : r === 'error' ? 500 : 400, headers: NO_STORE });
  }
  const token = form?.get('token');
  const r = await unsubscribe(req, token);
  const params = { estado: r, token: r === 'error' && isToken(token) ? token : null };
  return NextResponse.redirect(sameOriginUrl(req, '/newsletter/baja', params), { status: 303, headers: NO_STORE });
}
