import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { featuredInvitationNotice } from './featured-invitation';
import { emailBodyFont, emailDisplayFont, emailFonts, emailSignatureHtml, emailSignatureText } from './email-brand';
// RESEND_API_KEY is server-only. Never log recipients or tokens.
export const SITE_URL = (process.env.SITE_URL || 'https://condor-nest.lat').replace(/\/$/, '');
export const newToken = () => randomBytes(32).toString('hex');
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
export const isToken = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f]{64}$/.test(s);

export function confirmEmail(confirmUrl: string) {
  // No unsubscribe link here: the person is not subscribed until they confirm (List-Unsubscribe header still set).
  // Compact on purpose: on a phone the button must be visible without scrolling. Fixed px sizes so Gmail doesn't upscale.
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Confirmá tu suscripción</title>${emailFonts}</head>
<body style="margin:0;padding:0;background:#07080b;font-family:${emailBodyFont};color:#f2f4f8">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f4f5;opacity:0">Un toque y listo, confirmá tu suscripción.&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#07080b" style="background:#07080b"><tr><td align="center" style="padding:16px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0f1117;border:1px solid #262a36;border-radius:16px">
<tr><td style="padding:24px;color:#f2f4f8;font-family:${emailBodyFont}">
<div style="font-size:12px;line-height:16px;letter-spacing:2px;font-weight:700;color:#c6ff3d">CONDOR NEST</div>
<h1 style="font-family:${emailDisplayFont};margin:12px 0;font-size:23px;line-height:1.35;font-weight:700;color:#f2f4f8">Confirmá tu suscripción</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#cbd1dd">Un toque y listo: cada lunes te llegan las oportunidades de LatAm que cierran pronto.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#c6ff3d" style="border-radius:10px;background:#c6ff3d">
<a href="${confirmUrl}" style="display:block;height:48px;line-height:48px;font-size:16px;font-weight:700;color:#07080b;text-decoration:none;white-space:nowrap;border-radius:10px">Confirmar</a>
</td></tr></table>
<p style="margin:16px 0 0;font-size:13px;line-height:19px;color:#9aa3b5">El link vence en 48 h. Si no fuiste vos, ignorá este mail.</p>
${emailSignatureHtml}
</td></tr></table></td></tr></table></body></html>`;
  const text = `Confirmá tu suscripción a Condor Nest\n\nUn toque y listo: cada lunes te llegan las oportunidades de LatAm que cierran pronto.\n\nConfirmar: ${confirmUrl}\n\nEl link vence en 48 h. Si no fuiste vos, ignorá este mail.\n\n${emailSignatureText}`;
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

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
/** Internal notice to the site owner about a /publicar submission. */
export async function sendSubmissionNotice(id: number, f: Record<string, string | boolean | null>, invitation?: { url: string; expiresAt: string }): Promise<SendResult> {
  const to = process.env.PUBLICAR_NOTIFY_TO;
  if (!to) return { ok: false, reason: 'PUBLICAR_NOTIFY_TO not set' };
  const rows = Object.entries(f).filter(([, v]) => v !== null && v !== '').map(([k, v]) => [k, String(v)]);
  const text = `Nuevo evento para Condor Nest (#${id})\n\n` + rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nFila en Supabase: cn_submissions id=${id}`;
  const extra = invitation ? featuredInvitationNotice(invitation) : { html: '', text: '' };
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="color-scheme" content="dark">${emailFonts}</head><body style="margin:0;background:#07080b;color:#f2f4f8;font-family:${emailBodyFont}"><table role="presentation" width="100%"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" style="max-width:560px;background:#0f1117;border:1px solid #262a36;border-radius:16px"><tr><td style="padding:26px"><h2 style="font-family:${emailDisplayFont};color:#c6ff3d;margin:0 0 12px;font-size:22px">Nuevo evento #${id}</h2><table style="font-size:14px;color:#f2f4f8">` +
    rows.map(([k, v]) => `<tr><td style="color:#8b8aa6;padding:4px 12px 4px 0;vertical-align:top">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('') +
    `</table><p style="color:#9aa3b5;font-size:12px">Supabase: cn_submissions id=${id}</p>${extra.html}${emailSignatureHtml}</td></tr></table></td></tr></table></body></html>`;
  return resendSend({ to: [to], reply_to: typeof f.email === 'string' ? f.email : undefined, subject: `[Condor Nest] Nuevo evento: ${String(f.evento ?? '').slice(0, 80)}`, html, text: text + extra.text + `\n\n${emailSignatureText}` }, `sub-${id}`);
}
