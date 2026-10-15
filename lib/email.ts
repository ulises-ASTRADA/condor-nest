import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
// RESEND_API_KEY is server-only. Never log recipients or tokens.
export const SITE_URL = (process.env.SITE_URL || 'https://condor-nest.lat').replace(/\/$/, '');
export const newToken = () => randomBytes(32).toString('hex');
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
export const isToken = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f]{64}$/.test(s);

export function confirmEmail(confirmUrl: string, unsubUrl: string) {
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#07070b;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#ecebf5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#07070b;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#101018;border:1px solid #2a2540;border-radius:18px;overflow:hidden">
<tr><td style="height:4px;background:linear-gradient(90deg,#c6ff3d,#8b5cf6,#22d3ee);background-color:#c6ff3d"></td></tr>
<tr><td style="padding:32px 32px 8px"><div style="font-family:'Geist Mono',Menlo,monospace;font-size:12px;letter-spacing:.18em;color:#c6ff3d">CONDOR NEST</div>
<h1 style="margin:14px 0 10px;font-size:24px;line-height:30px;color:#ffffff">Confirmá tu suscripción</h1>
<p style="margin:0 0 22px;font-size:15px;line-height:23px;color:#a9a6bf">Cada lunes te mandamos los hackathons, bounties y grants de LatAm que cierran pronto y los que tienen poca competencia. Tocá el botón para activar tu suscripción.</p>
<a href="${confirmUrl}" style="display:inline-block;background:#c6ff3d;color:#0b0b10;font-weight:700;text-decoration:none;padding:13px 26px;border-radius:12px;font-size:15px">Confirmar suscripción</a>
<p style="margin:22px 0 0;font-size:12px;line-height:18px;color:#7d7a94">El link vence en 48 horas. Si no fuiste vos, ignorá este mail y no te vamos a escribir.</p></td></tr>
<tr><td style="padding:24px 32px 28px;border-top:1px solid #1f1b30;margin-top:24px;font-size:12px;color:#6d6a84">Hecho en Córdoba · <a href="${unsubUrl}" style="color:#8b8aa6">Darme de baja</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = `Confirmá tu suscripción a Condor Nest\n\nAbrí este link para activarla (vence en 48 horas):\n${confirmUrl}\n\nSi no fuiste vos, ignorá este mail.\nDarme de baja: ${unsubUrl}`;
  return { html, text };
}

export const RESEND_FROM = () => process.env.RESEND_FROM || 'Condor Nest <onboarding@resend.dev>';
/** Resend's shared test sender only delivers to the Resend account owner's address. */
export const isSandboxSender = () => /@resend\.dev>?$/i.test(RESEND_FROM());

export type SendResult = { ok: true } | { ok: false; reason: string };
/** POST to Resend. Never logs recipients, tokens or the key; returns a short reason on failure. */
export async function resendSend(payload: Record<string, unknown>, idem?: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error('resend: RESEND_API_KEY missing'); return { ok: false, reason: 'no_key' }; }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(8000), cache: 'no-store',
        headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json', ...(idem ? { 'Idempotency-Key': idem } : {}) },
        body: JSON.stringify({ from: RESEND_FROM(), ...payload }),
      });
      if (r.ok) return { ok: true };
      const j: any = await r.json().catch(() => ({}));
      const reason = `${r.status}:${String(j?.name ?? 'error')}`.slice(0, 80);
      // message from Resend contains no recipient; safe to log for diagnosis
      console.error('resend send failed', reason, String(j?.message ?? '').replace(/[^\s]+@[^\s]+/g, '<email>').slice(0, 200), isSandboxSender() ? '(sandbox sender onboarding@resend.dev)' : '');
      if (r.status !== 429 && r.status < 500) return { ok: false, reason }; // 4xx won't fix itself
    } catch { console.error('resend send error (network/timeout)', attempt); }
    await new Promise((res) => setTimeout(res, 600));
  }
  return { ok: false, reason: 'network' };
}

export async function sendConfirmation(to: string, confirmToken: string, unsubToken: string): Promise<SendResult> {
  const confirmUrl = `${SITE_URL}/api/newsletter/confirm?token=${confirmToken}`;
  const unsubUrl = `${SITE_URL}/api/newsletter/unsubscribe?token=${unsubToken}`;
  const { html, text } = confirmEmail(confirmUrl, unsubUrl);
  return resendSend({
    to: [to], subject: 'Confirmá tu suscripción a Condor Nest', html, text,
    headers: { 'List-Unsubscribe': `<${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  }, sha256(confirmToken));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
/** Internal notice to the site owner about a /publicar submission. */
export async function sendSubmissionNotice(id: number, f: Record<string, string | boolean | null>): Promise<SendResult> {
  const to = process.env.PUBLICAR_NOTIFY_TO || 'ulisesastrada1@gmail.com';
  const rows = Object.entries(f).filter(([, v]) => v !== null && v !== '').map(([k, v]) => [k, String(v)]);
  const text = `Nuevo evento para Condor Nest (#${id})\n\n` + rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nFila en Supabase: cn_submissions id=${id}`;
  const html = `<div style="font-family:Inter,Arial,sans-serif;background:#07070b;color:#ecebf5;padding:24px"><h2 style="color:#c6ff3d;margin:0 0 12px">Nuevo evento #${id}</h2><table style="font-size:14px">` +
    rows.map(([k, v]) => `<tr><td style="color:#8b8aa6;padding:4px 12px 4px 0;vertical-align:top">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('') +
    `</table><p style="color:#6d6a84;font-size:12px">Supabase: cn_submissions id=${id}</p></div>`;
  return resendSend({ to: [to], reply_to: typeof f.email === 'string' ? f.email : undefined, subject: `[Condor Nest] Nuevo evento: ${String(f.evento ?? '').slice(0, 80)}`, html, text }, `sub-${id}`);
}
