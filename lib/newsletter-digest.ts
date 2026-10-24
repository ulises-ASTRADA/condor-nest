import type { Listing } from './types';
import { effDeadline, isOpen, openToArLatam } from './rank';

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
  return listings.filter((listing) => {
    const deadline = effDeadline(listing);
    if (!deadline || !listing.applyUrl || listing.eligibility === 'unknown' || !openToArLatam(listing)) return false;
    const closing = new Date(deadline).getTime();
    return Number.isFinite(closing) && closing <= horizon && isOpen(listing, issueStart);
  }).sort((a, b) => new Date(effDeadline(a)!).getTime() - new Date(effDeadline(b)!).getTime()).slice(0, 5);
}

export function digestContent(listings: Listing[], issueDate: string) {
  const label = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(`${issueDate}T15:00:00Z`));
  const campaign = `?utm_source=newsletter&utm_medium=email&utm_campaign=${issueDate}`;
  const items = listings.map((listing) => {
    const deadline = effDeadline(listing)!;
    const closes = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(deadline));
    const url = `${SITE}/o/${encodeURIComponent(listing.slug)}${campaign}`;
    const access = listing.eligibility === 'restricted' || listing.eligibility === 'ar' ? ' · Revisá los requisitos' : '';
    return { title: listing.title, type: listing.type, closes, access, url };
  });
  const htmlItems = items.map((item) => `<tr><td style="padding:0 0 24px"><div style="font-size:12px;text-transform:uppercase;color:#71717a">${escapeHtml(item.type)} · Cierra ${escapeHtml(item.closes)}${escapeHtml(item.access)}</div><h2 style="font-size:18px;line-height:1.3;margin:7px 0">${escapeHtml(item.title)}</h2><a href="${escapeHtml(item.url)}" style="color:#155e75;font-size:14px;font-weight:700">Ver oportunidad →</a></td></tr>`).join('');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f4f5;color:#18181b;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px"><tr><td style="padding:28px"><div style="font-size:12px;font-weight:700;letter-spacing:.14em">CONDOR NEST</div><h1 style="font-size:26px;line-height:1.2;margin:12px 0">Oportunidades que cierran pronto</h1><p style="font-size:15px;line-height:1.6;color:#52525b">Edición del ${escapeHtml(label)}. Revisá las condiciones y horarios en la fuente oficial antes de aplicar.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">${htmlItems}</table><a href="${SITE}/${escapeHtml(campaign)}" style="display:inline-block;background:#c6ff3d;color:#101014;text-decoration:none;font-weight:700;padding:13px 18px;border-radius:8px">Explorar todas las oportunidades</a><p style="font-size:12px;line-height:1.5;color:#71717a;margin:30px 0 0">Hecho en Córdoba para builders de LatAm.<br><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#52525b">Dar de baja este correo</a></p></td></tr></table></td></tr></table></body></html>`;
  const text = `Condor Nest · Edición del ${label}\n\nOportunidades que cierran pronto. Revisá las condiciones y horarios en la fuente oficial antes de aplicar.\n\n${items.map((item) => `${item.title} (${item.type}) · Cierra ${item.closes}${item.access}\n${item.url}`).join('\n\n')}\n\nMás oportunidades: ${SITE}/${campaign}\n\nDar de baja: {{{RESEND_UNSUBSCRIBE_URL}}}`;
  return { name: `Condor Nest · ${issueDate}`, subject: `Condor Nest · ${items.length} oportunidades que cierran pronto`, html, text };
}
