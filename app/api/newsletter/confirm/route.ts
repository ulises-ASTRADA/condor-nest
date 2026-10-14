import { NextResponse } from 'next/server';
import { serverRpc } from '@/lib/server-supabase';
import { rateLimit } from '@/lib/rate-limit';
import { isToken, sha256, SITE_URL } from '@/lib/email';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const token = new URL(req.url).searchParams.get('token');
  let estado = 'invalido';
  if (rateLimit(`nlc:${ip}`, 20) && isToken(token)) {
    try { if ((await serverRpc('cn_confirm', { confirm_hash: sha256(token) })) === 'confirmed') estado = 'confirmado'; } catch { estado = 'error'; }
  }
  return NextResponse.redirect(`${SITE_URL}/newsletter/${estado}`, 303);
}
