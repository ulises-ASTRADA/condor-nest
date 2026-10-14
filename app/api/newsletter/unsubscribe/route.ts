import { NextResponse } from 'next/server';
import { serverRpc } from '@/lib/server-supabase';
import { rateLimit } from '@/lib/rate-limit';
import { isToken, SITE_URL } from '@/lib/email';
export const dynamic = 'force-dynamic';
async function run(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const token = new URL(req.url).searchParams.get('token');
  if (!rateLimit(`nlu:${ip}`, 20) || !isToken(token)) return 'invalido';
  try { return (await serverRpc('cn_unsubscribe', { unsub: token })) === 'unsubscribed' ? 'baja' : 'invalido'; } catch { return 'error'; }
}
export async function GET(req: Request) { return NextResponse.redirect(`${SITE_URL}/newsletter/${await run(req)}`, 303); }
// RFC 8058 one-click unsubscribe from mail clients
export async function POST(req: Request) { const e = await run(req); return new NextResponse(null, { status: e === 'baja' ? 200 : 400 }); }
