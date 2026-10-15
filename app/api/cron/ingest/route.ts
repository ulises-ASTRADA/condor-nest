import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { SOURCES } from '@/lib/ingest';
import { pingIndexNow } from '@/lib/indexnow';
import { HUBS } from '@/lib/hubs';
import { SITE } from '@/lib/site';
import { safeHttpsUrl } from '@/lib/types';
const clean = (r: any) => ({ ...r, source_url: safeHttpsUrl(r.source_url), apply_url: safeHttpsUrl(r.apply_url) });
import { serverRpc as rpc } from '@/lib/server-supabase';
import { createHash, timingSafeEqual } from 'node:crypto';
const digest = (s: string) => createHash('sha256').update(s).digest();
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !timingSafeEqual(digest(req.headers.get('authorization') ?? ''), digest(`Bearer ${secret}`))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const token = process.env.INGEST_TOKEN;
  const results: Record<string, unknown> = {};
  await Promise.all(Object.entries(SOURCES).map(async ([src, fn]) => {
    try {
      const rows = (await fn()).map(clean).filter((r) => r.source_url);
      const upserted = await rpc('cn_ingest', { token, src, rows, fetched: rows.length, err: null });
      results[src] = { fetched: rows.length, upserted };
    } catch (e) {
      const err = String(e).slice(0, 300);
      results[src] = { error: err };
      try { await rpc('cn_ingest', { token, src, rows: [], fetched: 0, err }); } catch {}
    }
  }));
  revalidateTag('listings');
  let indexnow: number | null = null;
  try {
    const since = Date.now() - 3 * 3.6e6;
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/listings?select=slug,updated_at,created_at&in_latam=eq.true`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' }, cache: 'no-store' });
    const rows: { slug: string; updated_at: string; created_at: string }[] = r.ok ? await r.json() : [];
    const urls = rows.filter((x) => new Date(x.updated_at || x.created_at).getTime() > since).map((x) => `${SITE}/o/${x.slug}`);
    if (urls.length) indexnow = await pingIndexNow([SITE, `${SITE}/sitemap.xml`, ...HUBS.map((h) => `${SITE}/${h.slug}`), ...urls]);
  } catch {}
  return NextResponse.json({ ok: true, results, indexnow });
}
