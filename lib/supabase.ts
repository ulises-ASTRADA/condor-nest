import { fromRow, type Listing } from './types';
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const headers = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' });

export async function getListings(): Promise<Listing[]> {
  const r = await fetch(`${URL_}/rest/v1/listings?select=*`, { headers: headers(), next: { revalidate: 300, tags: ['listings'] } });
  if (!r.ok) throw new Error(`supabase ${r.status}`);
  return (await r.json()).map(fromRow);
}
export async function getListing(slug: string): Promise<Listing | null> {
  const r = await fetch(`${URL_}/rest/v1/listings?select=*&slug=eq.${encodeURIComponent(slug)}`, { headers: headers(), next: { revalidate: 300, tags: ['listings'] } });
  if (!r.ok) throw new Error(`supabase ${r.status}`);
  const rows = await r.json();
  return rows[0] ? fromRow(rows[0]) : null;
}
export async function lastIngest(): Promise<string | null> {
  const r = await fetch(`${URL_}/rest/v1/ingest_runs?select=ran_at&error=is.null&order=ran_at.desc&limit=1`, { headers: headers(), next: { revalidate: 300, tags: ['listings'] } });
  if (!r.ok) return null;
  return (await r.json())[0]?.ran_at ?? null;
}
export async function rpc(fn: string, args: unknown) {
  const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers: headers(), body: JSON.stringify(args), cache: 'no-store' });
  const text = await r.text();
  if (!r.ok) throw new Error(`rpc ${fn} ${r.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}
