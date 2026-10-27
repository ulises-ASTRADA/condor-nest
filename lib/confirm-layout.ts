// Shared light layout of the newsletter confirmation mails (confirm + one-time reminder).
// Pure (no server-only) so it can be unit-tested and rendered for previews.
// Compact on purpose: on a phone the button must be visible without scrolling. Fixed px sizes so Gmail doesn't upscale.
export const escHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export type ConfirmLayout = {
  title: string;        // <title> and <h1>
  preheader: string;    // hidden inbox preview line
  paragraphs: string[]; // body copy, plain text (escaped here)
  button: string;
  url: string;          // confirm link
  finePrint: string[];  // small grey lines under the button (last one is the footer)
};

const PREHEADER_PAD = '&#8199;&#847;'.repeat(20);

export function confirmLayout(l: ConfirmLayout) {
  const body = l.paragraphs.map((p, i) => `<p style="margin:0 0 ${i === l.paragraphs.length - 1 ? 16 : 12}px;font-size:15px;line-height:22px;color:#3f3f46">${escHtml(p)}</p>`).join('\n');
  const small = l.finePrint.map((p, i) => `<p style="margin:${i === 0 ? 16 : 8}px 0 0;font-size:13px;line-height:19px;color:#71717a">${escHtml(p)}</p>`).join('\n');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escHtml(l.title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Helvetica,Arial,sans-serif;color:#18181b">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f4f5;opacity:0">${escHtml(l.preheader)}${PREHEADER_PAD}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5"><tr><td align="center" style="padding:16px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px">
<tr><td style="padding:24px">
<div style="font-size:12px;line-height:16px;letter-spacing:.12em;font-weight:700;color:#52525b">CONDOR NEST</div>
<h1 style="margin:8px 0 8px;font-size:22px;line-height:28px;font-weight:700;color:#18181b">${escHtml(l.title)}</h1>
${body}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#c6ff3d" style="border-radius:10px;background:#c6ff3d">
<a href="${escHtml(l.url)}" style="display:block;height:48px;line-height:48px;font-size:16px;font-weight:700;color:#0b0b10;text-decoration:none;white-space:nowrap;border-radius:10px">${escHtml(l.button)}</a>
</td></tr></table>
${small}
</td></tr></table></td></tr></table></body></html>`;
  return html;
}
