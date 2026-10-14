import { NextResponse } from 'next/server';
import { serverRpc } from '@/lib/server-supabase';
import { rateLimit } from '@/lib/rate-limit';
import { newToken, sha256, sendConfirmation } from '@/lib/email';
// Double opt-in: stores the address as 'pending' with a hashed 48h confirm token and mails the link via Resend.
// Only rows with status 'confirmed' may receive the newsletter.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
async function turnstileOk(token: unknown, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Turnstile disabled when unset
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret, response: token, remoteip: ip }), signal: AbortSignal.timeout(5000) });
    return !!(await r.json()).success;
  } catch { return false; }
}
export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (!rateLimit(`nl:${ip}`)) return NextResponse.json({ status: 'error' }, { status: 429 });
  const text = await req.text().catch(() => '');
  if (text.length > 4096) return NextResponse.json({ status: 'invalid' }, { status: 413 });
  let body: any = {}; try { body = JSON.parse(text); } catch {}
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  if (email.length > 254 || !EMAIL_RE.test(email)) return NextResponse.json({ status: 'invalid' }, { status: 400 });
  if (!(await turnstileOk(body?.turnstileToken, ip))) return NextResponse.json({ status: 'error' }, { status: 403 });
  try {
    const confirm = newToken(), unsub = newToken();
    const res = await serverRpc('cn_subscribe_v2', { email, confirm_hash: sha256(confirm), unsub });
    if (res === 'invalid') return NextResponse.json({ status: 'invalid' }, { status: 400 });
    // Already confirmed: don't mail again; same response so membership isn't revealed.
    if (res === 'confirmed') return NextResponse.json({ status: 'success' });
    const unsubToken = (await serverRpc('cn_unsub_token', { confirm_hash: sha256(confirm) })) ?? unsub;
    const sent = await sendConfirmation(email, confirm, unsubToken);
    return NextResponse.json({ status: sent ? 'success' : 'saved' });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
