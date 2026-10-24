import type { Listing } from './types';
import { effDeadline, isOpen, openToArLatam } from './rank';
import { isFeatured } from './featured';
import { emailBodyFont, emailDisplayFont, emailFonts, emailSignatureHtml, emailSignatureText } from './email-brand';

const SITE = 'https://condor-nest.lat';
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

/** A Sunday draft covers the following Monday in Argentina (UTC-3). */
export function nextMondayIssueDate(now: Date): string {
  const local = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const days = (8 - local.getUTCDay()) % 7 || 7;
  local.setUTCDate(local.getUTCDate() + days);
  return local.toISOString().slice(0, 10);
}

export function selectDigestListings(listings: Listing[], issueDate: string): Listing[] {
  const issueStart = new Date(`${issueDate}T12:00:00Z`);
  const horizon = issueStart.getTime() + 21 * 24 * 60 * 60 * 1000;
  const eligible = listings.filter((listing) => {
    const deadline = effDeadline(listing);
    if (!listing.applyUrl || listing.eligibility === 'unknown' || !openToArLatam(listing) || !isOpen(listing, issueStart)) return false;
    if (isFeatured(listing)) return !listing.featuredUntil || new Date(listing.featuredUntil) > issueStart;
    if (!deadline) return false;
    const closing = new Date(deadline).getTime();
    return Number.isFinite(closing) && closing <= horizon;
  });
  const featured = eligible.filter(isFeatured).sort((a, b) => (new Date(effDeadline(a) ?? 8640000000000000).getTime() - new Date(effDeadline(b) ?? 8640000000000000).getTime()));
  const regular = eligible.filter((listing) => !isFeatured(listing)).sort((a, b) => new Date(effDeadline(a)!).getTime() - new Date(effDeadline(b)!).getTime()).slice(0, 5);
  return [...featured, ...regular];
}

export function digestContent(listings: Listing[], issueDate: string) {
  const label = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(`${issueDate}T15:00:00Z`));
  const campaign = `?utm_source=newsletter&utm_medium=email&utm_campaign=${issueDate}`;
  const items = listings.map((listing) => {
    const deadline = effDeadline(listing);
    const closes = deadline ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(deadline)) : 'a confirmar';
    const url = `${SITE}/o/${encodeURIComponent(listing.slug)}${campaign}`;
    const access = listing.eligibility === 'restricted' || listing.eligibility === 'ar' ? ' · Revisá los requisitos' : '';
    return { title: listing.title, type: listing.type, closes, access, url, featured: isFeatured(listing) };
  });
  const htmlItems = items.map((item) => `<tr><td style="padding:0 0 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border:1px solid ${item.featured ? '#c6ff3d' : '#262a36'};border-radius:12px;background:#171a23"><tr><td style="padding:19px">${item.featured ? '<p style="margin:0 0 10px;font-size:11px;letter-spacing:1.5px;font-weight:700;color:#c6ff3d">★ DESTACADO</p>' : ''}<div style="font-size:12px;color:#9aa3b5">${escapeHtml(item.type.toUpperCase())} · ${item.closes === 'a confirmar' ? 'Cierre a confirmar' : `Cierra ${escapeHtml(item.closes)}`}${escapeHtml(item.access)}</div><h2 style="font-family:${emailDisplayFont};font-size:17px;line-height:1.4;color:#f2f4f8;margin:10px 0 13px">${escapeHtml(item.title)}</h2><a href="${escapeHtml(item.url)}" style="color:#c6ff3d;font-size:14px;font-weight:700;text-decoration:none">Ver oportunidad →</a></td></tr></table></td></tr>`).join('');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">${emailFonts}</head><body style="margin:0;background:#07080b;color:#f2f4f8;font-family:${emailBodyFont}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#07080b" style="background:#07080b"><tr><td align="center" style="padding:24px 10px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0f1117;border:1px solid #262a36;border-radius:16px"><tr><td style="padding:26px"><div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#c6ff3d">CONDOR NEST · ${escapeHtml(label.toUpperCase())}</div><h1 style="font-family:${emailDisplayFont};font-size:24px;line-height:1.35;color:#f2f4f8;margin:14px 0">Oportunidades que cierran pronto</h1><p style="font-size:15px;line-height:1.6;color:#9aa3b5;margin:0 0 24px">Seleccionamos convocatorias para builders de LatAm. Revisá condiciones y horarios en la fuente oficial antes de aplicar.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${htmlItems}</table><a href="${SITE}/${escapeHtml(campaign)}" style="display:inline-block;background:#c6ff3d;color:#07080b;text-decoration:none;font-size:15px;font-weight:700;padding:14px 18px;border-radius:10px">Explorar todas las oportunidades</a>${emailSignatureHtml}<p style="font-size:12px;line-height:1.5;color:#9aa3b5;margin:22px 0 0">Recibís este mail porque te suscribiste a Condor Nest.<br><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#c6ff3d">Dar de baja mi suscripción</a></p></td></tr></table></td></tr></table></body></html>`;
  const text = `Condor Nest · Edición del ${label}\n\nOportunidades que cierran pronto. Revisá las condiciones y horarios en la fuente oficial antes de aplicar.\n\n${items.map((item) => `${item.featured ? '★ DESTACADO · ' : ''}${item.title} (${item.type}) · Cierra ${item.closes}${item.access}\n${item.url}`).join('\n\n')}\n\nMás oportunidades: ${SITE}/${campaign}\n\n${emailSignatureText}\n\nDar de baja: {{{RESEND_UNSUBSCRIBE_URL}}}`;
  return { name: `Condor Nest · ${issueDate}`, subject: `Condor Nest · ${items.length} oportunidades que cierran pronto`, html, text };
}
