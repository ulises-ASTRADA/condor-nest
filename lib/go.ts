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


/** Remove every script from server-rendered HTML (inline, external, preload/modulepreload hints). CSS and fonts stay. */
export function stripScripts(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script\b[^>]*\/>/gi, '')
    .replace(/<link\b[^>]*\b(?:as=["']?script|rel=["']?modulepreload)[^>]*>/gi, '');
}

/** Hides toggles that only work with JS (music/theme/motion) on a script-free page. (The footer form is not rendered there at all.) */
export const NO_JS_STYLE = '<style>.site-header button,footer button[role=switch]{display:none!important}</style>';
/** Script-free version of a server-rendered page: scripts removed, JS-only controls hidden. */
export const noJsPage = (html: string) => stripScripts(html).replace(/<\/head>/i, `${NO_JS_STYLE}</head>`);

/**
 * Fixed origin for the internal fetch of /go-gone. Never derived from the request's Host header.
 * Production → https://condor-nest.lat; otherwise this deployment's own https://$VERCEL_URL; null if unknown (→ plain 404).
 */
export function goneOrigin(env: { VERCEL_ENV?: string; VERCEL_URL?: string }): string | null {
  if (env.VERCEL_ENV === 'production') return 'https://condor-nest.lat';
  const u = (env.VERCEL_URL ?? '').trim().toLowerCase();
  return /^[a-z0-9.-]+$/.test(u) ? `https://${u}` : null;
}
