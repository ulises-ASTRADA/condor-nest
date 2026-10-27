import { fromRow, LISTING_COLS, LISTING_DATE_COLS, type Listing } from './types';
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const headers = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' });

/** Listings with the date-only columns; if PostgREST rejects them (400: migration not applied yet), retry without them. */
async function listingRows(filter: string): Promise<any[]> {
  const get = (cols: string) => fetch(`${URL_}/rest/v1/listings?select=${cols}&in_latam=eq.true${filter}`, { headers: headers(), next: { revalidate: 300, tags: ['listings'] } });
  let r = await get(`${LISTING_COLS},${LISTING_DATE_COLS}`);
  if (r.status === 400) r = await get(LISTING_COLS);
  if (!r.ok) throw new Error(`supabase ${r.status}`);
  return r.json();
}
export async function getListings(): Promise<Listing[]> {
  return (await listingRows('')).map(fromRow);
}
export async function getListing(slug: string): Promise<Listing | null> {
  const rows = await listingRows(`&slug=eq.${encodeURIComponent(slug)}`);
  return rows[0] ? fromRow(rows[0]) : null;
}
export async function lastIngest(): Promise<string | null> {
  const r = await fetch(`${URL_}/rest/v1/cn_last_ingest?select=ran_at&order=ran_at.desc&limit=1`, { headers: headers(), next: { revalidate: 300, tags: ['listings'] } });
  if (!r.ok) return null;
  return (await r.json())[0]?.ran_at ?? null;
}
export async function rpc(fn: string, args: unknown) {
  const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers: headers(), body: JSON.stringify(args), cache: 'no-store' });
  const text = await r.text();
  if (!r.ok) throw new Error(`rpc ${fn} ${r.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}
