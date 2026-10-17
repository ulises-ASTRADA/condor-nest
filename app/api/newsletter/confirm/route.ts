import { NextResponse } from 'next/server';
import { serverRpc } from '@/lib/server-supabase';
import { rateLimit } from '@/lib/rate-limit';
import { isToken, sha256, SITE_URL } from '@/lib/email';
export const dynamic = 'force-dynamic';
// GET never confirms (mail scanners prefetch links): it only forwards to the page with the "Confirmar" button.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  return NextResponse.redirect(`${SITE_URL}/newsletter/confirmar${isToken(token) ? `?token=${token}` : ''}`, 303);
}
// POST from the confirmation page: JSON ({token}) from the auto-confirm script returns {estado};
// form posts (noscript fallback) redirect to /newsletter/<estado>. Token is single-use and expires (cn_confirm).
export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const isJson = (req.headers.get('content-type') ?? '').includes('application/json');
  let token: unknown = null;
  if (isJson) token = (await req.json().catch(() => null))?.token;
  else token = (await req.formData().catch(() => null))?.get('token');
  let estado = 'invalido';
  if (rateLimit(`nlc:${ip}`, 20) && isToken(token)) {
    try { if ((await serverRpc('cn_confirm', { confirm_hash: sha256(token) })) === 'confirmed') estado = 'confirmado'; } catch { estado = 'error'; }
  }
  if (isJson) return NextResponse.json({ estado }, { headers: { 'cache-control': 'no-store' } });
  return NextResponse.redirect(`${SITE_URL}/newsletter/${estado}`, 303);
}
