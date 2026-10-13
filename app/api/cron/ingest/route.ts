import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { SOURCES } from '@/lib/ingest';
import { rpc } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const token = process.env.INGEST_TOKEN;
  const results: Record<string, unknown> = {};
  await Promise.all(Object.entries(SOURCES).map(async ([src, fn]) => {
    try {
      const rows = await fn();
      const upserted = await rpc('cn_ingest', { token, src, rows, fetched: rows.length, err: null });
      results[src] = { fetched: rows.length, upserted };
    } catch (e) {
      const err = String(e).slice(0, 300);
      results[src] = { error: err };
      try { await rpc('cn_ingest', { token, src, rows: [], fetched: 0, err }); } catch {}
    }
  }));
  revalidateTag('listings');
  return NextResponse.json({ ok: true, results });
}
