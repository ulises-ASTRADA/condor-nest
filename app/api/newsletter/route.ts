import { NextResponse } from 'next/server';
import { serverRpc } from '@/lib/server-supabase';
import { rateLimit } from '@/lib/rate-limit';
import { turnstileOk } from '@/lib/turnstile';
import { newToken, sha256, sendConfirmation } from '@/lib/email';
// Double opt-in: stores the address as 'pending' with a hashed 48h confirm token and mails the link via Resend.
// Only rows with status 'confirmed' may receive the newsletter.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
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
    // Confirmed subscribers get a clear message; neither case sends another mail.
    if (res === 'confirmed') return NextResponse.json({ status: 'already' });
    if (res === 'recent') return NextResponse.json({ status: 'recent' });
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
