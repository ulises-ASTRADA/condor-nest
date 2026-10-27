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
  assert.equal(ev.eventStatus, 'https://schema.org/EventScheduled'); // not marked cancelled/postponed for being over
});

test('finished listing page body: grey "Gratis" (no green "✓ Abierto · gratis"), Inscripción "Cerrada", button "Ver hackathons abiertos" to the forward link', async () => {
  const React = await import('react');
  (globalThis as any).React = React; // tsx compiles JSX with the classic runtime
  const { renderToStaticMarkup } = await import('react-dom/server');
  const page = await import('../app/o/[slug]/page.tsx');
  const html = renderToStaticMarkup(await page.default({ params: Promise.resolve({ slug: row.slug }) }));
  assert.match(html, /dl-pill dl-pill--closed[^>]*>Finalizado</);
  assert.match(html, /dl-pill dl-pill--closed[^>]*>Gratis</);
  const pills = html.match(/<div class="flex flex-wrap gap-1\.5">.*?<\/div>/)![0];
  assert.doesNotMatch(pills, /Abierto|✓|text-cyan/); // the green/cyan eligibility pill is gone on finished pages
  assert.doesNotMatch(html, /sin confirmar/i);
  assert.match(html, /<dt[^>]*>Inscripción<\/dt><dd[^>]*><span[^>]*>Cerrada<\/span><\/dd>/);
  assert.doesNotMatch(html, /Ver similares abiertas/);
  // sticky (mobile) + aside (desktop) buttons, same destination as "Mirá los hackathons abiertos en LatAm" under the title
  const btns = [...html.matchAll(/<a[^>]*href="([^"]*)"[^>]*>Ver hackathons abiertos<\/a>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  assert.equal(btns.length, 2);
  assert.ok(btns.every((h) => h === '/?tipo=hackathon'));
  assert.match(html, /href="\/\?tipo=hackathon"[^>]*>Mirá los hackathons abiertos en LatAm</);
});

test('isFree reads only the listing data; finished button text per type', async () => {
  const { isFree } = await import('./hubs.ts');
  assert.equal(isFree({ eligibilityShort: 'Abierto · gratis', eligibilityNote: null }), true);
  assert.equal(isFree({ eligibilityShort: 'Solo estudiantes', eligibilityNote: 'Inscripción gratuita' }), true);
  assert.equal(isFree({ eligibilityShort: 'Global', eligibilityNote: null }), false);
  const { finishedCtaText } = await import('./seo.ts');
  assert.equal(finishedCtaText('hackathon'), 'Ver hackathons abiertos');
  assert.equal(finishedCtaText('bounty'), 'Ver bounties abiertos');
  assert.equal(finishedCtaText('grant'), 'Ver grants abiertos');
});

test('no weekly/Monday promise in the footer newsletter or /acerca', async () => {
  const { readFileSync } = await import('node:fs');
  const nl = readFileSync(new URL('../components/Newsletter.tsx', import.meta.url), 'utf8');
  assert.match(nl, />Novedades por mail, sin spam\.</);
  assert.doesNotMatch(nl, /Novedades cada lunes/);
  const acerca = readFileSync(new URL('../app/acerca/page.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(acerca, /lunes|por semana/);
});

test('no Monday/weekly promise in any newsletter copy, hub text, confirm mail or confirmed state', async () => {
  const { readFileSync } = await import('node:fs');
  const r = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');
  const nl = r('../components/Newsletter.tsx');
  assert.match(nl, />Novedades en tu mail</);
  assert.match(nl, />Las mejores oportunidades, en tu mail</);
  assert.match(nl, />Te mandamos lo que cierra pronto y lo que tiene poca competencia\. Sin spam\.</);
  const hubPage = r('../app/[hub]/page.tsx');
  assert.match(hubPage, /¿Organizás un hackathon en/);
  assert.match(r('./hubs.ts'), /por el newsletter\./);
  const mail = r('./email.ts');
  assert.equal(mail.split('Un toque y listo: te llegan por mail las oportunidades de LatAm que cierran pronto.').length - 1, 2); // HTML + text
  for (const [name, src] of Object.entries({ nl, hubPage, hubs: r('./hubs.ts'), mail, auto: r('../app/newsletter/confirmar/AutoConfirm.tsx'), estado: r('../app/newsletter/[estado]/page.tsx') })) {
    assert.doesNotMatch(src, /lunes|por semana|semanal/i, name);
  }
});
