import 'server-only';
import { parseVenues, type Venue } from './venues';
// raw is not granted to anon: read only raw->venues server-side with the service role, like organizer.ts.
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export async function getVenues(slug: string): Promise<Venue[] | null> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  try {
    const r = await fetch(`${URL_}/rest/v1/listings?select=venues:raw->venues&in_latam=eq.true&slug=eq.${encodeURIComponent(slug)}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 300, tags: ['listings'] } });
    if (!r.ok) return null;
    return parseVenues((await r.json())[0]?.venues);
  } catch { return null; }
}
