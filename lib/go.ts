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
