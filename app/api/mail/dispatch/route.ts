import { NextResponse } from 'next/server';
import { serverRpc } from '@/lib/server-supabase';
import { rateLimit } from '@/lib/rate-limit';
import { isToken, sha256, resendSend } from '@/lib/email';
import { dispatchTemplate } from '@/lib/template-dispatch';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function POST(req: Request) {
  const headers = { 'cache-control': 'no-store' };
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (!rateLimit(`mail-dispatch:${ip}`, 10)) return NextResponse.json({ status: 'limited' }, { status: 429, headers });
  const body = await req.text();
  if (body.length > 512) return NextResponse.json({ status: 'invalid' }, { status: 400, headers });
  let token: unknown;
  try { token = JSON.parse(body)?.token; } catch { /* invalid body */ }
  if (!isToken(token)) return NextResponse.json({ status: 'invalid' }, { status: 400, headers });
  try {
    const status = await dispatchTemplate(sha256(token), { rpc: serverRpc, send: resendSend });
    return NextResponse.json({ status }, { status: status === 'invalid' ? 400 : status === 'failed' ? 502 : 200, headers });
  } catch { return NextResponse.json({ status: 'error' }, { status: 500, headers }); }
}
