import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const so = req.resolve('server-only'); req.cache[so] = { id: so, filename: so, loaded: true, exports: {} } as any;
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://db.test'; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
const base = { source: 'manual', title_lang: 'es', organizer: 'x', source_url: 'https://e.com', eligibility: 'global', ecosystems: [], in_latam: true, competitors_kind: null };
const rows = [
  { ...base, id: 'a', slug: 'hack-cba', type: 'hackathon', title: 'Hack Córdoba', modality: 'irl', city: 'Córdoba', country: 'AR', deadline_at: '2099-12-01T12:00:00Z', starts_at: '2099-12-05T12:00:00Z', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-20T10:00:00Z' },
  { ...base, id: 'b', slug: 'st-bounty', source: 'superteam', type: 'bounty', title: 'Bounty X', modality: 'online', city: null, country: null, deadline_at: '2099-12-10T12:00:00Z', created_at: '2026-10-02T00:00:00Z', updated_at: '2026-10-22T08:00:00Z' },
];
globalThis.fetch = (async (u: string) => new Response(JSON.stringify(String(u).includes('cn_last_ingest') ? [{ ran_at: '2026-10-27T09:00:00Z' }] : rows), { status: 200 })) as typeof fetch;

test('sitemap lastmod: home and hubs = newest updated_at of the listings they show; listings (incl. st-* bounties) = their own updated_at', async () => {
  const sm = await (await import('../app/sitemap.ts')).default();
  const at = (path: string) => sm.find((e) => e.url === `https://condor-nest.lat${path}`)!;
  assert.equal(new Date(at('').lastModified!).toISOString(), '2026-10-22T08:00:00.000Z');
  assert.equal(new Date(at('/hackathons-argentina').lastModified!).toISOString(), '2026-10-20T10:00:00.000Z');
  assert.equal(new Date(at('/bounties').lastModified!).toISOString(), '2026-10-22T08:00:00.000Z');
  assert.equal(new Date(at('/o/st-bounty').lastModified!).toISOString(), '2026-10-22T08:00:00.000Z');
  // a hub with nothing to show falls back to the last ingest, never "now"
  const empty = sm.find((e) => e.url.endsWith('/hackathons-online'));
  assert.ok(empty); assert.equal(new Date(empty!.lastModified!).toISOString(), '2026-10-27T09:00:00.000Z');
  assert.equal(at('').changeFrequency, 'daily'); assert.equal(at('').priority, 1);
});
