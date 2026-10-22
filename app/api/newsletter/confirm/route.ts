import { NextResponse } from 'next/server';
import { serverRpc } from '@/lib/server-supabase';
import { rateLimit } from '@/lib/rate-limit';
import { isToken, sha256, newToken, SITE_URL, resendSend } from '@/lib/email';
import { confirmWithWelcome } from '@/lib/newsletter-confirm';
import { sameOriginUrl } from '@/lib/same-origin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
// GET never confirms (mail scanners prefetch links): it only forwards to the page with the "Confirmar" button.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  return NextResponse.redirect(sameOriginUrl(req, '/newsletter/confirmar', { token: isToken(token) ? token : null }), 303);
}
// POST from the confirmation page: JSON ({token}) from the auto-confirm script returns {estado};
// form posts (noscript fallback) redirect to /newsletter/<estado>. Token is single-use and expires (cn_confirm).
export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const isJson = (req.headers.get('content-type') ?? '').includes('application/json');
  let token: unknown = null;
  if (isJson) token = (await req.json().catch(() => null))?.token;
  else token = (await req.formData().catch(() => null))?.get('token');
  let estado: 'invalido' | 'confirmado' | 'error' = 'invalido';
  if (rateLimit(`nlc:${ip}`, 20) && isToken(token)) {
    try {
      const unsubscribe = newToken();
      estado = await confirmWithWelcome(sha256(token), unsubscribe, sha256(unsubscribe), SITE_URL, { rpc: serverRpc, send: resendSend });
    } catch { estado = 'error'; }
  }
  if (isJson) return NextResponse.json({ estado }, { headers: { 'cache-control': 'no-store' } });
  return NextResponse.redirect(sameOriginUrl(req, `/newsletter/${estado}`), 303);
}
