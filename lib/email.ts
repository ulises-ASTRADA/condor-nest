import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { featuredInvitationNotice } from './featured-invitation';
import { confirmLayout } from './confirm-layout';
import { reminderEmail, reminderFrom } from './newsletter-reminder';
// RESEND_API_KEY is server-only. Never log recipients or tokens.
export const SITE_URL = (process.env.SITE_URL || 'https://condor-nest.lat').replace(/\/$/, '');
export const newToken = () => randomBytes(32).toString('hex');
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
export const isToken = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f]{64}$/.test(s);

const CONFIRM_INTRO = 'Un toque y listo: te llegan por mail las oportunidades de LatAm que cierran pronto.';
export function confirmEmail(confirmUrl: string) {
  // No unsubscribe link here: the person is not subscribed until they confirm (List-Unsubscribe header still set).
  const html = confirmLayout({
    title: 'Confirmá tu suscripción', preheader: 'Un toque y listo, confirmá tu suscripción.', paragraphs: [CONFIRM_INTRO],
    button: 'Confirmar', url: confirmUrl, finePrint: ['El link vence en 48 h. Si no fuiste vos, ignorá este mail.', 'Hecho en Córdoba'],
  });
  const text = `Confirmá tu suscripción a Condor Nest\n\n${CONFIRM_INTRO}\n\nConfirmar: ${confirmUrl}\n\nEl link vence en 48 h. Si no fuiste vos, ignorá este mail.\n\nHecho en Córdoba`;
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
  const confirmUrl = `${SITE_URL}/newsletter/confirmar?token=${confirmToken}`;
  const unsubUrl = `${SITE_URL}/api/newsletter/unsubscribe?token=${unsubToken}`;
  const { html, text } = confirmEmail(confirmUrl);
  return resendSend({
    to: [to], subject: 'Confirmá tu suscripción a Condor Nest', html, text,
    headers: { 'List-Unsubscribe': `<${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  }, sha256(confirmToken));
}

/** One-time reminder for an expired signup. Caller must have rotated both tokens (hashes stored) first. */
export async function sendReminder(to: string, confirmToken: string, unsubToken: string): Promise<SendResult> {
  const confirmUrl = `${SITE_URL}/newsletter/confirmar?token=${confirmToken}`;
  const unsubUrl = `${SITE_URL}/api/newsletter/unsubscribe?token=${unsubToken}`;
  const { subject, html, text } = reminderEmail(confirmUrl);
  return resendSend({
    from: reminderFrom(RESEND_FROM()), to: [to], subject, html, text,
    headers: { 'List-Unsubscribe': `<${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  }, `newsletter-reminder-${sha256(confirmToken)}`);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
/** Internal notice to the site owner about a /publicar submission. */
export async function sendSubmissionNotice(id: number, f: Record<string, string | boolean | null>, invitation?: { url: string; expiresAt: string }): Promise<SendResult> {
  const to = process.env.PUBLICAR_NOTIFY_TO;
  if (!to) return { ok: false, reason: 'PUBLICAR_NOTIFY_TO not set' };
  const rows = Object.entries(f).filter(([, v]) => v !== null && v !== '').map(([k, v]) => [k, String(v)]);
  const text = `Nuevo evento para Condor Nest (#${id})\n\n` + rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nFila en Supabase: cn_submissions id=${id}`;
  const html = `<div style="font-family:Inter,Arial,sans-serif;background:#07070b;color:#ecebf5;padding:24px"><h2 style="color:#c6ff3d;margin:0 0 12px">Nuevo evento #${id}</h2><table style="font-size:14px">` +
    rows.map(([k, v]) => `<tr><td style="color:#8b8aa6;padding:4px 12px 4px 0;vertical-align:top">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('') +
    `</table><p style="color:#6d6a84;font-size:12px">Supabase: cn_submissions id=${id}</p></div>`;
  const extra = invitation ? featuredInvitationNotice(invitation) : { html: '', text: '' };
  return resendSend({ to: [to], reply_to: typeof f.email === 'string' ? f.email : undefined, subject: `[Condor Nest] Nuevo evento: ${String(f.evento ?? '').slice(0, 80)}`, html: html.replace(/<\/div>$/, `${extra.html}</div>`), text: text + extra.text }, `sub-${id}`);
}
