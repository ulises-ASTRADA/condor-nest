import 'server-only';
// Organizer "about" data: read server-side with the service role (columns are NOT granted to anon).
export type OrgAbout = { description: string; sourceUrl: string; sourceHost: string; website: string | null };
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const https = (u: unknown): string | null => {
  if (typeof u !== 'string') return null;
  try { const x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch { return null; }
};
export async function getOrgAbout(slug: string): Promise<OrgAbout | null> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  try {
    const r = await fetch(`${URL_}/rest/v1/listings?select=organizer_description,organizer_source_url,organizer_website&in_latam=eq.true&slug=eq.${encodeURIComponent(slug)}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 300, tags: ['listings'] } });
    if (!r.ok) return null;
    const row = (await r.json())[0];
    const d = typeof row?.organizer_description === 'string' ? row.organizer_description.trim() : '';
    const src = https(row?.organizer_source_url);
    if (!d || !src || d.length > 200 || /a completar/i.test(d)) return null;
    return { description: d, sourceUrl: src, sourceHost: new URL(src).hostname.replace(/^www\./, ''), website: https(row.organizer_website) };
  } catch { return null; }
}
