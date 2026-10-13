import { NextResponse } from 'next/server';
import { serverRpc } from '@/lib/server-supabase';
import { rateLimit } from '@/lib/rate-limit';
// Stores the address as 'pending'.
// TODO(double opt-in): needs an email provider (spec §6). Until then rows stay 'pending' and must not be mailed.
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
    await serverRpc('cn_subscribe', { email });
    // Uniform response: never reveal whether the address was already subscribed.
    return NextResponse.json({ status: 'success' });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
