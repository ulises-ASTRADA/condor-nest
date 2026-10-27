import { featuredMoney } from './featured-pricing';
import type { FeaturedRequest } from './featured-request';
import { emailBodyFont, emailDisplayFont, emailFonts, emailSignatureHtml, emailSignatureText } from './email-brand';

export type SavedFeaturedRequest = {
  id: string; details: FeaturedRequest; days: number; starts_on: string; ends_on: string;
  subtotal_cents: number; discount_percent: number; discount_cents: number; total_cents: number;
  owner_mail_status: string; contact_mail_status: string; expires_at: string;
};
const esc = (text: string) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

export function featuredEmail(saved: SavedFeaturedRequest, audience: 'owner' | 'contact') {
  const f = saved.details;
  const owner = audience === 'owner';
  const heading = owner ? 'Nueva solicitud de destacado' : 'Recibimos tu solicitud de destacado';
  const intro = owner ? 'Hay una solicitud pendiente de revisión y pago.' : '¡Gracias por elegir Condor Nest! Guardamos tu solicitud. Vamos a revisar los datos y contactarte para coordinar el pago y confirmar las fechas.';
  const rows = [
    ['Referencia', saved.id], ['Evento', f.title], ['Organización', f.organizerName], ['Email de contacto', f.contactEmail],
    ...(f.contactPhone ? [['Teléfono', f.contactPhone]] : []),
    ['Duración del destacado', `${saved.days} días`], ['Fechas del destacado', `${saved.starts_on} al ${saved.ends_on}`],
    ['Precio base', featuredMoney(saved.subtotal_cents)],
    ...(saved.discount_percent ? [[`Descuento (${saved.discount_percent}%)`, `−${featuredMoney(saved.discount_cents)}`]] : []),
    ['Total', featuredMoney(saved.total_cents)], ['Inscripción', f.registrationUrl],
    ...(owner ? [['En pocas palabras', f.summary], ['Premio', f.prize], ['Inicio del evento', f.eventStart], ['Fin del evento', f.eventEnd], ['Modalidad', f.modality], ...(f.location ? [['Ubicación', f.location]] : []), ['Elegibilidad', f.eligibility], ['Sobre el organizador', f.organizerAbout], ...(f.notes ? [['Notas', f.notes]] : [])] : []),
  ];
  const pending = 'Todavía no se realizó ningún cobro ni se activó el destacado. El presupuesto y la reserva del código de descuento tienen una vigencia de 48 horas desde la solicitud. Si necesitás más tiempo, coordinamos una nueva confirmación.';
  const signature = emailSignatureText;
  return {
    subject: owner ? `[Condor Nest] Solicitud de destacado: ${f.title.slice(0,80)}` : `Recibimos tu solicitud · ${f.title.slice(0,80)}`,
    text: `${heading}\n\n${intro}\n\n${rows.map(([key,value]) => `${key}: ${value}`).join('\n')}\n\n${pending}\n\n${signature}`,
    html: `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">${emailFonts}</head><body style="margin:0;background:#07080b;font-family:${emailBodyFont};color:#f2f4f8"><table role="presentation" width="100%"><tr><td align="center" style="padding:24px 12px"><table role="presentation" style="width:100%;max-width:600px;background:#0f1117;border:1px solid #262a36;border-radius:16px"><tr><td style="padding:28px;line-height:1.6"><p style="margin:0 0 18px;color:#c6ff3d;font-size:12px;font-weight:700;letter-spacing:2px">CONDOR NEST</p><h1 style="font-family:${emailDisplayFont};font-size:22px;line-height:1.4;color:#f2f4f8">${heading}</h1><p style="color:#cbd1dd">${intro}</p><table role="presentation" style="width:100%;font-size:14px;color:#f2f4f8">${rows.map(([key,value]) => `<tr><td style="padding:8px 12px 8px 0;vertical-align:top;color:#9aa3b5">${esc(key)}</td><td style="padding:8px 0;word-break:break-word;white-space:pre-wrap">${esc(value)}</td></tr>`).join('')}</table><p style="padding:16px;background:#171a23;border:1px solid #262a36;border-radius:10px;font-size:13px;color:#cbd1dd">${pending}</p>${emailSignatureHtml}</td></tr></table></td></tr></table></body></html>`,
  };
}
