import { emailBodyFont, emailDisplayFont, emailFonts, emailSignatureHtml, emailSignatureText } from './email-brand';

const esc = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function welcomeEmail(siteUrl: string, unsubscribeUrl: string) {
  const site = new URL(siteUrl);
  const unsubscribe = new URL(unsubscribeUrl);
  if (site.protocol !== 'https:' || unsubscribe.protocol !== 'https:' || unsubscribe.origin !== site.origin) throw new Error('Invalid email URL');
  const subject = '¡Bienvenido a Condor Nest!';
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><meta name="x-apple-disable-message-reformatting"><title>${subject}</title>
<style>
body,table,td,p,a,h1{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;text-size-adjust:100%}
@media screen and (max-width:480px){
.mail-outer{padding:12px 8px!important}
.mail-content{padding:24px 18px!important}
.mail-title{font-size:24px!important;line-height:30px!important}
.mail-cta{font-size:15px!important;line-height:22px!important;padding:14px 8px!important}
}
</style>${emailFonts}</head>
<body style="margin:0;padding:0;width:100%;font-size:16px;line-height:25px;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;text-size-adjust:100%;background:#07080b;font-family:${emailBodyFont};color:#f1f1f6">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Tu suscripción está confirmada. Encontrá tu próxima oportunidad para crear.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#07080b" style="background:#07080b"><tr><td align="center" class="mail-outer" style="padding:24px 12px">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="width:100%;max-width:520px;table-layout:fixed;background:#0f1117;border:1px solid #262a36;border-radius:16px;box-shadow:0 0 30px rgba(198,255,61,.08)"><tr><td class="mail-content" style="padding:28px;color:#f1f1f6;font-family:${emailBodyFont};font-size:16px;line-height:25px;word-wrap:break-word">
<p style="margin:0 0 20px;font-size:12px;letter-spacing:2px;font-weight:700;color:#c6ff3d">CONDOR NEST</p>
<h1 class="mail-title" style="font-family:${emailDisplayFont};color:#f1f1f6;margin:0 0 16px;font-size:25px;line-height:34px">¡Ya sos parte del nido!</h1>
<p style="color:#e8e9ef;font-size:16px;line-height:25px;margin:0 0 16px">Gracias por sumarte. Tu suscripción ya está confirmada.</p>
<p style="color:#e8e9ef;font-size:16px;line-height:25px;margin:0 0 16px">En Condor Nest reunimos hackatones, bounties y grants para builders de Latinoamérica: oportunidades para aprender, construir proyectos y conectar con otras personas.</p>
<p style="color:#e8e9ef;font-size:16px;line-height:25px;margin:0 0 24px">Mientras llega el próximo resumen, podés explorar las convocatorias abiertas y encontrar tu próximo desafío.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#c6ff3d" style="border-radius:10px;border:1px solid #c6ff3d;box-shadow:0 0 18px rgba(198,255,61,.22)"><a class="mail-cta" href="${esc(site.href)}" style="display:block;white-space:nowrap;padding:16px 12px;font-size:16px;line-height:20px;font-weight:700;color:#0b0b10;text-decoration:none">Explorar oportunidades</a></td></tr></table>
<p style="color:#e8e9ef;font-size:15px;line-height:23px;margin:24px 0 0">¡Qué bueno tenerte por acá!</p>
${emailSignatureHtml}
<p style="font-size:12px;line-height:19px;color:#9ca3b5;margin:0">Recibís este mail porque confirmaste tu suscripción a Condor Nest.<br><a href="${esc(unsubscribe.href)}" style="color:#c6ff3d">Dar de baja mi suscripción</a></p>
</td></tr></table></td></tr></table></body></html>`;
  const text = `¡Ya sos parte del nido!\n\nGracias por sumarte. Tu suscripción ya está confirmada.\n\nEn Condor Nest reunimos hackatones, bounties y grants para builders de Latinoamérica: oportunidades para aprender, construir proyectos y conectar con otras personas.\n\nMientras llega el próximo resumen, podés explorar las convocatorias abiertas y encontrar tu próximo desafío.\n\nExplorar oportunidades: ${site.href}\n\n¡Qué bueno tenerte por acá!\n\n${emailSignatureText}\n\nRecibís este mail porque confirmaste tu suscripción a Condor Nest.\nDar de baja mi suscripción: ${unsubscribe.href}`;
  return { subject, html, text };
}
