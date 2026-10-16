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
    // Only hashes are stored; the plain tokens live in the mail. DB enforces: no re-send to the same address within 1 h, global hourly cap.
    const confirm = newToken(), unsub = newToken();
    const res = await serverRpc('cn_subscribe_v2', { email, confirm_hash: sha256(confirm), unsub_hash: sha256(unsub) });
    if (res === 'invalid') return NextResponse.json({ status: 'invalid' }, { status: 400 });
    if (res === 'rate') return NextResponse.json({ status: 'error' }, { status: 429 });
    // Already confirmed, or a confirm mail went out < 1 h ago: don't mail again; same response so membership isn't revealed.
    if (res === 'confirmed' || res === 'recent') return NextResponse.json({ status: 'success' });
    const sent = await sendConfirmation(email, confirm, unsub);
    if (!sent.ok) {
      // keep the pending row; record why so the confirm mail can be re-sent later (no PII in the reason)
      await serverRpc('cn_confirm_mail', { confirm_hash: sha256(confirm), err: sent.reason }).catch(() => {});
      return NextResponse.json({ status: 'saved' });
    }
    return NextResponse.json({ status: 'success' });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
