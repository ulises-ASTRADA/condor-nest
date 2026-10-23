import { NextResponse } from 'next/server';
import { serverRpc } from '@/lib/server-supabase';
import { rateLimit } from '@/lib/rate-limit';
import { sendSubmissionNotice, newToken, sha256, SITE_URL } from '@/lib/email';
import { turnstileOk } from '@/lib/turnstile';
// /publicar submissions: always stored in Supabase (cn_submissions), then an email notice is attempted via Resend.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const KINDS = ['hackathon', 'bounty', 'grant'] as const;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max + 1) : '');
function httpUrl(v: string) {
  try { const u = new URL(v); return u.protocol === 'https:' && u.hostname.includes('.') ? u.toString() : null; } catch { return null; }
}
export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (!rateLimit(`pub:${ip}`, 3)) return NextResponse.json({ status: 'rate' }, { status: 429 });
  const raw = await req.text().catch(() => '');
  if (raw.length > 8192) return NextResponse.json({ status: 'invalid' }, { status: 413 });
  let b: any = {}; try { b = JSON.parse(raw); } catch {}
  if (str(b.website, 200)) return NextResponse.json({ status: 'ok' }); // honeypot: pretend success
  const notes = typeof b.notes === 'string' ? b.notes.trim().slice(0, 2001) : '';
  const f = {
    name: str(b.name, 120), email: str(b.email, 254).toLowerCase(), event_name: str(b.event_name, 200),
    kind: str(b.kind, 20), location: str(b.location, 160), dates: str(b.dates, 160), prize: str(b.prize, 160),
    url: httpUrl(str(b.url, 500)) ?? '', notes, wants_featured: b.wants_featured === true,
  };
  const errors: Record<string, string> = {};
  if (f.name.length < 2 || f.name.length > 120) errors.name = 'Tu nombre es obligatorio (mínimo 2 letras).';
  if (!EMAIL_RE.test(f.email) || f.email.length > 254) errors.email = 'Revisá el email.';
  if (f.event_name.length < 3 || f.event_name.length > 200) errors.event_name = 'El nombre del evento es obligatorio (mínimo 3 caracteres).';
  if (!(KINDS as readonly string[]).includes(f.kind)) errors.kind = 'Elegí un tipo.';
  if (f.location.length < 2 || f.location.length > 160) errors.location = 'El país es obligatorio: poné país y ciudad, u “Online”.';
  if (f.dates.length < 2 || f.dates.length > 160) errors.dates = 'Las fechas son obligatorias.';
  if (f.prize.length > 160) errors.prize = 'Muy largo.';
  if (!f.url || f.url.length > 500) errors.url = 'Necesitamos el link oficial con https:// (no aceptamos http://).';
  if (f.notes.length > 2000) errors.notes = 'Máximo 2000 caracteres.';
  if (Object.keys(errors).length) return NextResponse.json({ status: 'invalid', errors }, { status: 400 });
  if (!(await turnstileOk(b.turnstileToken, ip))) return NextResponse.json({ status: 'bot' }, { status: 403 });
  let id: number;
  let invitation: { url: string; expiresAt: string } | undefined;
  try {
    if (f.wants_featured) {
      const token = newToken();
      const saved = await serverRpc('cn_submit_featured', { p: f, p_token_hash: sha256(token) }) as { id: number; expires_at?: string };
      id = Number(saved.id);
      if (id !== -1 && saved.expires_at) invitation = { url: `${SITE_URL}/destacar?solicitud=${token}`, expiresAt: saved.expires_at };
    } else id = Number(await serverRpc('cn_submit', { p: f }));
  } catch { console.error('publicar: insert failed'); return NextResponse.json({ status: 'error' }, { status: 500 }); }
  if (id === -1) return NextResponse.json({ status: 'rate' }, { status: 429 }); // DB-backed hourly caps
  const sent = await sendSubmissionNotice(id, {
    nombre: f.name, email: f.email, evento: f.event_name, tipo: f.kind, lugar: f.location, fechas: f.dates,
    premio: f.prize || null, link: f.url, notas: f.notes || null, destacado: f.wants_featured ? 'quiere info de Destacado' : null,
  }, invitation);
  await serverRpc('cn_submission_mail', { sub_id: id, st: sent.ok ? 'sent' : `failed:${sent.reason}` }).catch(() => {});
  return NextResponse.json({ status: 'ok' }); // stored either way; the owner sees it in Supabase even if the mail failed
}
