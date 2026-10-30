import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
// The page imports 'server-only' (it throws outside the Next server); stub it for this test process only.
const req = createRequire(import.meta.url);
const so = req.resolve('server-only');
req.cache[so] = { id: so, filename: so, loaded: true, exports: {} } as any;
// Finished listings must stay indexable (they keep ranking and send people to open ones) and keep their real Event dates.
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://db.test';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
process.env.VERCEL_ENV = 'production';
const row = {
  id: 'shp', slug: 'shippear-3-rosario-2026', source: 'manual', type: 'hackathon', title: 'shippear #3: hackatón de un día en Rosario', title_lang: 'es',
  organizer: 'shippear', source_url: 'https://example.com/shippear', apply_url: null, reward_amount: null, reward_currency: null, reward_usd: null, reward_kind: null,
  reward_text: null, deadline_at: null, starts_at: '2026-10-24T12:00:00Z', ends_at: '2026-10-24T21:00:00Z', competitors: null, competitors_kind: 'registrations',
  eligibility: 'global', eligibility_note: null, eligibility_short: 'Abierto · gratis', modality: 'irl', city: 'Rosario', ecosystems: [], summary_es: null,
  featured: false, featured_until: null, curated: true, disclosure_key: null, source_post_url: null, verified_url: null, created_at: '2026-10-10T00:00:00Z',
  updated_at: '2026-10-25T00:00:00Z', in_latam: true, country: 'AR', venue: null, venue_locality: null,
};
globalThis.fetch = (async () => new Response(JSON.stringify([row]), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch;

test('finished listing page: indexable (no robots noindex in metadata, headers or robots.txt), finished title/description, hub link', async () => {
  const page = await import('../app/o/[slug]/page.tsx');
  const md: any = await page.generateMetadata({ params: Promise.resolve({ slug: row.slug }) });
  assert.equal(md.robots, undefined);
  assert.equal(md.title.absolute, 'Shippear #3 Hackathon Rosario 2026 — finalizado | Condor Nest');
  assert.match(md.description, /^Hackathon finalizado\./);
  // the mocked DB has only this (finished) listing, so the hub has 0 open: falls back to the LatAm feed, never "los 0"
  assert.match(md.description, /Mirá los hackathons abiertos en LatAm\.$/);
  assert.equal(md.alternates.canonical, '/o/shippear-3-rosario-2026');
  assert.equal(md.twitter.title, md.title.absolute);
  assert.equal(md.twitter.description, md.description);
  assert.equal(md.twitter.images[0].url, '/o/shippear-3-rosario-2026/opengraph-image');
  assert.equal(md.openGraph.images[0].url, '/o/shippear-3-rosario-2026/opengraph-image');
  const cfg = (await import('../next.config.ts')).default as any;
  const { pathToRegexp } = await import('next/dist/compiled/path-to-regexp/index.js' as any).catch(() => ({ pathToRegexp: null }));
  for (const h of await cfg.headers()) {
    const hasNoindex = h.headers.some((x: any) => x.key.toLowerCase() === 'x-robots-tag');
    if (!hasNoindex) continue;
    const matchesO = pathToRegexp ? pathToRegexp(h.source).test('/o/shippear-3-rosario-2026') : h.source === '/:path*' || h.source.startsWith('/o');
    assert.equal(matchesO, false, `X-Robots-Tag on ${h.source} would hit /o/ pages in production`);
  }
  const robots = (await import('../app/robots.ts')).default();
  for (const r of [robots.rules].flat() as any[]) assert.ok(![r.disallow].flat().some((d: string) => '/o/shippear-3-rosario-2026'.startsWith(d)));
});

test('finished listing: Event JSON-LD keeps the real startDate/endDate', async () => {
  const { eventLd } = await import('./jsonld.ts');
  const { fromRow } = await import('./types.ts');
  const ev: any = eventLd(fromRow(row as any));
  assert.equal(ev.startDate, '2026-10-24T12:00:00Z');
  assert.equal(ev.endDate, '2026-10-24T21:00:00Z');
  assert.equal(ev.image[0], 'https://condor-nest.lat/o/shippear-3-rosario-2026/opengraph-image');
  assert.equal(ev.eventStatus, 'https://schema.org/EventScheduled'); // not marked cancelled/postponed for being over
});
