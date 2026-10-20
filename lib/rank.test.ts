import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortListings, competitionScore, matches, DEFAULT_FILTERS } from './rank.ts';
import { sig2, deadlineInfo } from './format.ts';
const base: any = { country: null, eligibilityShort: null, rewardText: null, id: 'x', slug: 'x', type: 'bounty', title: 't', organizer: null, source: 'superteam', sourceUrl: 'u', rewardAmount: null, rewardCurrency: 'USD', rewardUsd: null, rewardKind: null, deadlineAt: '2099-01-01T00:00:00Z', startsAt: null, endsAt: null, competitors: null, competitorsKind: 'submissions', eligibility: 'global', eligibilityNote: null, modality: 'online', city: null, ecosystems: [], summaryEs: null, featured: false, featuredUntil: null, disclosureKey: null, updatedAt: '', createdAt: '2026-01-01', titleLang: 'en', applyUrl: null, sourcePostUrl: null, verifiedUrl: null, curated: false };
const L = (o: any) => ({ ...base, ...o });
const now = new Date('2026-10-13T00:00:00Z');
test('score formula', () => {
  assert.equal(competitionScore(L({ rewardUsd: 1000, competitors: 24 })), 40);
  assert.equal(competitionScore(L({ rewardUsd: 1000, competitors: 18, competitorsKind: 'registrations' })), 100);
  assert.equal(competitionScore(L({ rewardUsd: 1000, competitors: null })), null);
});
test('menos competencia: eligible first, then score, data-less last by deadline', () => {
  const r = sortListings([L({ id: 'a' }), L({ id: 'b', rewardUsd: 100, competitors: 0 }), L({ id: 'c', rewardUsd: 1000, competitors: 99 }), L({ id: 'd', deadlineAt: '2098-01-01T00:00:00Z' })], 'menos-competencia', now);
  assert.deepEqual(r.map((x) => x.id), ['b', 'c', 'd', 'a']);
});
test('type + virtual filters', () => {
  assert.equal(matches(L({}), { ...DEFAULT_FILTERS, tipos: ['hackathon'] }, now), false);
  assert.equal(matches(L({ modality: 'irl' }), { ...DEFAULT_FILTERS, virtual: true }, now), false);
  assert.equal(matches(L({ modality: 'online' }), { ...DEFAULT_FILTERS, virtual: true }, now), true);
  assert.equal(matches(L({ title: 'Agentic Banking MCP' }), { ...DEFAULT_FILTERS, ecos: ['IA'] }, now), true);
  assert.equal(matches(L({ title: 'Write a thread' }), { ...DEFAULT_FILTERS, ecos: ['Ethereum'] }, now), false);
});
test('sig2 + deadline states', () => {
  assert.equal(sig2(41.6), 42); assert.equal(sig2(1234), 1200);
  assert.equal(deadlineInfo(L({ deadlineAt: '2026-10-13T05:00:00Z' }), now).state, 'urgent');
  assert.equal(deadlineInfo(L({ deadlineAt: '2026-10-12T05:00:00Z' }), now).state, 'closed');
  assert.equal(deadlineInfo(L({ deadlineAt: null, type: 'grant' }), now).state, 'rolling');
});

import { superteamEligibility, latamCountryOf } from './ingest.ts';
test('LatAm scope', () => {
  assert.equal(superteamEligibility('Global'), null);
  assert.equal(superteamEligibility('Turkey'), null);
  assert.equal(superteamEligibility('Argentina')?.eligibility, 'ar');
  assert.equal(superteamEligibility('Brazil')?.note, 'Solo Brasil');
  assert.equal(latamCountryOf('Online'), null);
  assert.equal(latamCountryOf('Washington DC'), null);
  assert.equal(latamCountryOf('Bogotá, Colombia'), 'CO');
  assert.equal(latamCountryOf('São Paulo'), 'BR');
});

test('shortName: derived from the DB title, no new facts', async () => {
  const { shortName } = await import('./hubs');
  const n = (title: string, city: string | null = null) => shortName({ ...base, title, city });
  assert.equal(n('shippear #3: hackatón de un día en Rosario', 'Rosario'), 'shippear #3');
  assert.equal(n('belo buildathon: Agentic Banking MCP', 'Buenos Aires'), 'belo buildathon');
  assert.equal(n('Hackathon EDU HUB · LABITCONF 2026', 'Buenos Aires'), 'EDU HUB de LABITCONF');
  assert.equal(n('Hackatón Media Party Buenos Aires 2026', 'Buenos Aires'), 'Media Party');
  assert.equal(n('HackaTwin', 'Buenos Aires'), 'HackaTwin');
  assert.equal(n('Hackathon', null), 'Hackathon');
});

test('venueLines: all-or-none per list, only DB venues', async () => {
  const { venueLines } = await import('./hubs');
  const irl = (venue: string | null, venueLocality: string | null = null) => ({ ...base, modality: 'irl', city: 'Buenos Aires', venue, venueLocality });
  assert.deepEqual(venueLines([irl('Digital House', 'CABA, Belgrano'), irl(null), irl(null)]), [null, null, null]);
  assert.deepEqual(venueLines([irl('Digital House', 'CABA, Belgrano'), irl('UTN')]), ['Digital House · Belgrano', 'UTN']);
  assert.deepEqual(venueLines([irl('UTN'), { ...irl('Somewhere'), modality: 'online' }]), [null, null]);
  assert.deepEqual(venueLines([irl('UTN')]), ['UTN']);
  assert.deepEqual(venueLines([]), []);
});

// ---- feed-filters: ?ciudad / ?virtual / ?abierto + access rule ----
import { filtersFromSearch, filtersToSearch, cityOptions, access, hasRequirements } from './rank.ts';
const cityRows = [L({ id: 'c1', modality: 'irl', city: 'Córdoba', country: 'AR' }), L({ id: 'c2', modality: 'hybrid', city: 'Cordoba', country: 'AR' }), L({ id: 'c3', modality: 'irl', city: 'Ciudad de México', country: 'MX' }), L({ id: 'o1', modality: 'online', city: 'Rosario' })];
const opts = cityOptions(cityRows);
test('cityOptions: in-person/hybrid only, accent-insensitive slugs', () => {
  assert.deepEqual(opts.map((c) => c.slug), ['ciudad-de-mexico', 'cordoba']);
  assert.deepEqual(opts.find((c) => c.slug === 'cordoba')!.countries, ['AR']);
});
test('parse ciudad/virtual/abierto; invalid values ignored', () => {
  const p = (q: Record<string, string>) => filtersFromSearch(q, opts).f;
  assert.equal(p({ ciudad: 'cordoba' }).ciudad, 'cordoba');
  assert.equal(p({ ciudad: 'CORDOBA' }).ciudad, 'cordoba');
  assert.equal(p({ ciudad: 'xx' }).ciudad, null);
  assert.equal(p({ ciudad: 'rosario' }).ciudad, null); // only an online listing has it
  assert.equal(p({ ciudad: '<script>' }).ciudad, null);
  assert.equal(filtersFromSearch({ ciudad: 'cordoba' }).f.ciudad, null); // no derived list -> nothing accepted
  assert.equal(p({ ciudad: 'cordoba', pais: 'mx' }).ciudad, null); // city outside the selected country
  assert.equal(p({ virtual: '1' }).virtual, true);
  for (const v of ['true', '0', 'yes', '']) { assert.equal(p({ virtual: v }).virtual, false); assert.equal(p({ abierto: v }).abiertoTodos, false); }
  assert.equal(p({ abierto: '1' }).abiertoTodos, true);
  assert.equal(p({ modalidad: 'online' }).virtual, true); // legacy URL
  assert.equal(p({ modalidad: 'online,irl' }).virtual, false);
});
test('filtersToSearch round-trip', () => {
  const { f, sort } = filtersFromSearch({ ciudad: 'cordoba', virtual: '1', abierto: '1', pais: 'ar' }, opts);
  assert.equal(filtersToSearch(f, sort), 'pais=ar&ciudad=cordoba&virtual=1&abierto=1');
  assert.equal(filtersToSearch(filtersFromSearch({ modalidad: 'online' }, opts).f, 'cierra-pronto'), 'virtual=1');
});
test('access rule: restricted/ar, age, student-only; listing who is welcome is not a requirement', () => {
  assert.equal(access(L({ eligibility: 'restricted' })), 'requisitos');
  assert.equal(access(L({ eligibility: 'ar' })), 'requisitos');
  assert.equal(access(L({ eligibility: 'unknown' })), 'confirmar');
  assert.equal(access(L({ eligibilityShort: 'Abierto · +18 años' })), 'requisitos');
  assert.equal(access(L({ eligibilityShort: 'Abierto · desde 13 años' })), 'requisitos');
  assert.equal(access(L({ eligibilityNote: 'Solo alumnos de la UNAM mayores de edad' })), 'requisitos');
  assert.equal(hasRequirements(L({ eligibilityNote: 'Estudiantes de Ingeniería en Sistemas o afines.' })), true);
  assert.equal(access(L({ eligibilityShort: 'Abierto a todos · presencial BA', eligibilityNote: 'Developers, diseñadores, founders, estudiantes y cualquier persona con ganas de construir. Equipos de hasta 4 personas.' })), 'todos');
  assert.equal(access(L({ eligibilityNote: 'La página oficial no publica restricciones de edad ni de residencia.' })), 'todos');
  assert.equal(access(L({ eligibility: 'latam' })), 'todos');
});
test('combined filters: city + virtual + abierto', () => {
  const rows = [L({ id: 'a', modality: 'irl', city: 'Córdoba', country: 'AR' }), L({ id: 'b', modality: 'hybrid', city: 'Córdoba', country: 'AR' }), L({ id: 'c', modality: 'hybrid', city: 'Córdoba', country: 'AR', eligibilityShort: 'Abierto · +18 años' }), L({ id: 'd', modality: 'online' })];
  const run = (q: Record<string, string>) => { const f = filtersFromSearch(q, cityOptions(rows)).f; return rows.filter((l) => matches(l, f, now)).map((l) => l.id); };
  assert.deepEqual(run({ ciudad: 'cordoba' }), ['a', 'b', 'c']);
  assert.deepEqual(run({ virtual: '1' }), ['b', 'c', 'd']);
  assert.deepEqual(run({ ciudad: 'cordoba', virtual: '1' }), ['b', 'c']);
  assert.deepEqual(run({ ciudad: 'cordoba', virtual: '1', abierto: '1' }), ['b']);
  assert.deepEqual(run({ ciudad: 'xx', abierto: '1' }), ['a', 'b', 'd']);
});
import { eventLd } from './jsonld.ts';
test('event JSON-LD offers: registration url + availability, never an unverified price', () => {
  const ev = eventLd(L({ slug: 's', type: 'hackathon', modality: 'irl', city: 'Rosario', country: 'AR', startsAt: '2099-01-02T12:00:00Z', deadlineAt: '2099-01-01T00:00:00Z', applyUrl: 'https://example.org/apply' })) as any;
  assert.equal(ev.offers.url, 'https://example.org/apply');
  assert.equal(ev.offers.availability, 'https://schema.org/InStock');
  assert.equal('price' in ev.offers, false); assert.equal('priceCurrency' in ev.offers, false);
  assert.equal('isAccessibleForFree' in ev, false);
  assert.equal(ev.eventAttendanceMode, 'https://schema.org/OfflineEventAttendanceMode');
});
