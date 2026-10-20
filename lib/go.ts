// Outbound "Inscribirme" links go through /go/<slug> so clicks can be counted (see app/go/[slug]/route.ts).
// The destination is ALWAYS the listing's stored apply_url, looked up server-side; /go/ takes no URL parameter.
export const goPath = (slug: string) => `/go/${encodeURIComponent(slug)}`;

/** Bare hostname of an official URL, without "www.", or null. */
export function bareHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, '') || null; } catch { return null; }
}

const HOST_LABEL: [RegExp, string][] = [
  [/(^|\.)(lu\.ma|luma\.com)$/, 'Luma'],
  [/(^|\.)devpost\.com$/, 'Devpost'],
  [/(^|\.)taikai\.network$/, 'Taikai'],
  [/(^|\.)dorahacks\.io$/, 'DoraHacks'],
  [/(^|\.)ethglobal\.com$/, 'ETHGlobal'],
  [/(^|\.)superteam\.fun$/, 'Superteam'],
  [/(^|\.)spaceappschallenge\.org$/, 'NASA Space Apps'],
];
/** Platform name for the button label, from the stored official URL's host; null for unknown hosts. */
export function hostLabel(host: string | null): string | null {
  if (!host) return null;
  for (const [re, name] of HOST_LABEL) if (re.test(host)) return name;
  return null;
}

/** Slugs /go/ accepts at all (anything else, e.g. containing "../" or "%2F", is a 400). */
export const VALID_SLUG = /^[A-Za-z0-9_-]{1,200}$/;

const SITE_HOSTS = new Set(['condor-nest.lat', 'www.condor-nest.lat']);
const PATH_RE = /^\/[A-Za-z0-9/_.-]*$/;
/**
 * Path of the condor-nest page where a /go/ click happened, from the Referer header.
 * Only when the Referer host is condor-nest.lat / www.condor-nest.lat or equals the request's own host
 * (so previews and localhost work). Pathname only (no query/fragment), max 200 chars, safe charset; else null.
 */
export function refPath(referer: string | null | undefined, ownHost: string | null | undefined): string | null {
  if (!referer) return null;
  let u: URL; try { u = new URL(referer); } catch { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const own = (ownHost ?? '').toLowerCase();
  if (!SITE_HOSTS.has(u.hostname.toLowerCase()) && !(own && u.host.toLowerCase() === own)) return null;
  const p = u.pathname;
  return p.length >= 1 && p.length <= 200 && PATH_RE.test(p) ? p : null;
}

/** Same-origin fallback for /go/<slug> with no usable apply_url: the listing page if it exists, else null (styled 404). */
export const goFallback = (slug: string, listingExists: boolean): string | null => (listingExists && VALID_SLUG.test(slug) ? `/o/${slug}` : null);

/** Self-contained 404 page for /go/<slug> when no listing exists (site colors, light/dark, no scripts, no external assets). */
export const GO_GONE_HTML = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Esta convocatoria ya no está publicada · Condor Nest</title><style>
:root{--bg:7 8 11;--surface:15 17 23;--border:38 42 54;--fg:242 244 248;--muted:154 163 181;--lime:198 255 61;--on-lime:7 8 11;color-scheme:dark}
@media (prefers-color-scheme:light){:root{--bg:245 246 248;--surface:255 255 255;--border:217 220 227;--fg:10 11 16;--muted:82 90 107;--lime:61 102 0;--on-lime:255 255 255;color-scheme:light}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:rgb(var(--bg));color:rgb(var(--fg));font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:flex;align-items:flex-start;justify-content:center;padding:64px 16px}
main{max-width:28rem;width:100%;border:1px solid rgb(var(--border));background:rgb(var(--surface));border-radius:14px;padding:24px;text-align:center}
h1{font-size:1.125rem;margin:0 0 6px}p{margin:0;color:rgb(var(--muted));font-size:.95rem}
a{display:inline-flex;align-items:center;min-height:44px;margin-top:16px;padding:0 20px;border-radius:999px;background:rgb(var(--lime));color:rgb(var(--on-lime));font-weight:500;text-decoration:none}
a:focus-visible{outline:2px solid rgb(var(--lime));outline-offset:3px}
</style></head><body><main><h1>Esta convocatoria ya no está publicada</h1><p>Puede que haya cerrado o cambiado de link.</p><a href="/">Ver convocatorias abiertas</a></main></body></html>`;
