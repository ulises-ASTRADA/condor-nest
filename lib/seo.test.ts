import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalOrigin } from './site.ts';
import { isFinished, wayForward, listingName, listingTitle, listingState, listingDescription, hubTitle, hubDescription, nextHub, nextHubText, TITLE_MAX } from './seo.ts';
import { hubBySlug } from './hubs.ts';
import nextConfig from '../next.config.ts';

const base: any = { country: null, eligibilityShort: null, rewardText: null, id: 'x', slug: 'x', type: 'hackathon', title: 't', organizer: null, source: 'curated', sourceUrl: 'u', rewardAmount: null, rewardCurrency: 'USD', rewardUsd: null, rewardKind: null, deadlineAt: null, startsAt: null, endsAt: null, competitors: null, competitorsKind: 'submissions', eligibility: 'global', eligibilityNote: null, modality: 'irl', city: null, ecosystems: [], summaryEs: null, featured: false, featuredUntil: null, disclosureKey: null, updatedAt: '', createdAt: '2026-01-01', titleLang: 'es', applyUrl: null, sourcePostUrl: null, verifiedUrl: null, curated: false };
const L = (o: any) => ({ ...base, ...o });
const now = new Date('2026-10-27T15:00:00Z');
const shippear = L({ slug: 'shippear-3-rosario-2026', title: 'shippear #3: hackatón de un día en Rosario', city: 'Rosario', country: 'AR', startsAt: '2026-10-24T12:00:00Z', endsAt: '2026-10-24T21:00:00Z' });
const openPayments = L({ slug: 'open-payments-medellin-2026', title: 'Hackatón Open Payments Medellín', city: 'Medellín', country: 'CO', startsAt: '2026-10-16T12:00:00Z', endsAt: '2026-10-18T00:00:00Z' });

test('canonical origin: https, no www, no trailing slash, falls back to condor-nest.lat', () => {
  assert.equal(canonicalOrigin('https://www.condor-nest.lat/'), 'https://condor-nest.lat');
  assert.equal(canonicalOrigin('http://WWW.condor-nest.lat'), 'https://condor-nest.lat');
  assert.equal(canonicalOrigin('https://condor-nest.lat'), 'https://condor-nest.lat');
  assert.equal(canonicalOrigin(undefined), 'https://condor-nest.lat');
  assert.equal(canonicalOrigin(''), 'https://condor-nest.lat');
  assert.equal(canonicalOrigin('not a url'), 'https://condor-nest.lat');
});

test('www.condor-nest.lat/* → 301 to https://condor-nest.lat/* (path kept; Next keeps the query string)', async () => {
  const rules = await (nextConfig as any).redirects();
  const www = rules.find((r: any) => r.has?.some((h: any) => h.type === 'host' && h.value === 'www.condor-nest.lat'));
  assert.ok(www);
  assert.equal(www.source, '/:path*');
  assert.equal(www.destination, 'https://condor-nest.lat/:path*');
  assert.equal(www.statusCode, 301);
  assert.equal(www.permanent, undefined); // Next rejects permanent + statusCode together
});

test('listing name: kind, city and year added only when missing', () => {
  assert.equal(listingName(shippear), 'Shippear #3 Hackathon Rosario 2026');
  assert.equal(listingName(openPayments), 'Hackathon Open Payments Medellín 2026'); // DB name says "Hackatón": normalized only here
  assert.equal(listingName(L({ title: 'hackaton Rosario', city: 'Rosario' })), 'Hackathon Rosario');
  assert.equal(listingName(L({ title: 'ETH Buenos Aires Hackathon 2026', city: 'Buenos Aires', startsAt: '2026-11-01T12:00:00Z' })), 'ETH Buenos Aires Hackathon 2026');
  assert.equal(listingName(L({ type: 'bounty', modality: 'online', title: 'Write a Solana thread', deadlineAt: '2026-11-05T12:00:00Z' })), 'Bounty: Write a Solana thread 2026');
  assert.equal(listingName(L({ type: 'grant', modality: 'online', title: 'Solana Foundation Grants' })), 'Solana Foundation Grants');
  assert.equal(listingName(L({ title: 'Hack to the Future · Córdoba Tech Week 2026', city: 'Córdoba', startsAt: '2026-11-01T12:00:00Z' })), 'Hack to the Future · Córdoba Tech Week Hackathon 2026');
  assert.equal(listingName(L({ title: 'Argentina Space 2026 · Hackathon', city: 'Salta', startsAt: '2026-11-01T12:00:00Z' })), 'Argentina Space 2026 · Hackathon Salta');
  // year in Argentina time: 31/12 22:00 AR is still 2026
  assert.equal(listingName(L({ title: 'Fin de año', modality: 'online', startsAt: '2027-01-01T01:00:00Z' })), 'Fin de año Hackathon 2026');
});

test('finished listing: title says "finalizado", description too, and points to the country hub', () => {
  assert.equal(listingState(shippear, now), 'finished');
  const t = listingTitle(shippear, { now, prize: null, date: '24 de octubre' });
  assert.equal(t, 'Shippear #3 Hackathon Rosario 2026 — finalizado | Condor Nest');
  assert.equal(listingTitle(openPayments, { now, prize: 'USD 20.000 en premios', date: '16 de octubre' }), 'Hackathon Open Payments Medellín 2026 — finalizado | Condor Nest');
  const hub = nextHub(shippear)!;
  assert.equal(hub.slug, 'hackathons-argentina');
  assert.equal(nextHub(openPayments), null); // no Colombia hub: no invented link
  assert.equal(nextHubText(hub, 5), 'los 5 hackathons abiertos en Argentina');
  assert.equal(nextHubText(hub, 1), 'el hackathon abierto en Argentina');
  assert.equal(nextHubText(hub, 0), 'hackathons en Argentina');
  const d = listingDescription(['Hackathon presencial en Rosario de shippear.', 'Abierto · gratis.', 'Empezó el 24 de octubre.'], 'finished', `Mirá ${nextHubText(hub, 5)}.`);
  assert.equal(d, 'Hackathon finalizado. Hackathon presencial en Rosario de shippear. Abierto · gratis. Empezó el 24 de octubre. Mirá los 5 hackathons abiertos en Argentina.');
  assert.ok(d.length <= 155);
  // the hub link survives even when the body is long; whole sentences only
  const long = listingDescription(['Hackathon presencial en Medellín de Interledger Foundation.', 'Abierto a todos · Medellín.', 'USD 20.000 en premios.', 'Empezó el 16 de octubre.'], 'finished', 'Mirá los 5 hackathons abiertos en Argentina.');
  assert.ok(long.length <= 155 && long.startsWith('Hackathon finalizado. Hackathon presencial') && long.endsWith('Mirá los 5 hackathons abiertos en Argentina.'), long);
  assert.equal(listingDescription(['Bounty virtual de Superteam.', 'Cierra el 3 de noviembre.'], 'open', null), 'Bounty virtual de Superteam. Cierra el 3 de noviembre.');
});

test('open listing: published prize, close date, online / abierto a LatAm, ~60 chars', () => {
  const open = L({ title: 'Hackatón Open Payments Medellín', city: 'Medellín', startsAt: '2026-11-16T12:00:00Z', deadlineAt: '2026-11-10T12:00:00Z' });
  assert.equal(listingTitle(open, { now, prize: 'USD 20.000', date: 'cierra 10 de noviembre' }), 'Hackathon Open Payments Medellín 2026 — premio USD 20.000 | Condor Nest');
  // a part that would push past ~60 chars is dropped, never cut mid-phrase
  assert.equal(listingTitle(open, { now, prize: 'USD 20.000 en premios', date: 'cierra 10 de noviembre' }), 'Hackathon Open Payments Medellín 2026 | Condor Nest');
  const online = L({ title: 'AI Agents', modality: 'online', eligibility: 'latam', deadlineAt: '2026-11-10T12:00:00Z' });
  assert.equal(listingTitle(online, { now, prize: null, date: 'cierra 10 de noviembre' }), 'AI Agents Hackathon 2026 — cierra 10 de noviembre, online | Condor Nest');
  const latam = L({ title: 'Build Córdoba', city: 'Córdoba', eligibility: 'latam', startsAt: '2026-11-20T12:00:00Z' });
  assert.equal(listingTitle(latam, { now, prize: null, date: '20 de noviembre' }), 'Build Córdoba Hackathon 2026 — 20 de noviembre | Condor Nest'); // date first; LatAm only if it fits
  assert.equal(listingTitle(latam, { now, prize: null, date: null }), 'Build Córdoba Hackathon 2026 — abierto a LatAm | Condor Nest');
  // no invented prize: none published → none in the title
  assert.doesNotMatch(listingTitle(latam, { now, prize: null, date: null }), /premio|USD/);
  for (const t of [listingTitle(open, { now, prize: 'USD 20.000 en premios', date: 'cierra 10 de noviembre' }), listingTitle(online, { now, prize: null, date: 'cierra 10 de noviembre' })]) assert.ok(t.replace(' | Condor Nest', '').length <= TITLE_MAX);
});

test('every finished page has a way forward: country hub with real count, else the open feed for its type', () => {
  assert.deepEqual(wayForward(shippear, () => 5), { href: '/hackathons-argentina', text: 'Mirá los 5 hackathons abiertos en Argentina' });
  assert.deepEqual(wayForward(shippear, () => 1), { href: '/hackathons-argentina', text: 'Mirá el hackathon abierto en Argentina' });
  // 0 open in the hub, or no hub: open feed of that type in LatAm; never "los 0"
  assert.deepEqual(wayForward(shippear, () => 0), { href: '/?tipo=hackathon', text: 'Mirá los hackathons abiertos en LatAm' });
  assert.deepEqual(wayForward(openPayments, () => 9), { href: '/?tipo=hackathon', text: 'Mirá los hackathons abiertos en LatAm' });
  assert.deepEqual(wayForward(L({ type: 'bounty', modality: 'online' }), () => 0), { href: '/?tipo=bounty', text: 'Mirá los bounties abiertos en LatAm' });
  for (const n of [0, 1, 2, 7]) {
    const fw = wayForward(shippear, () => n);
    assert.doesNotMatch(fw.text, /los 0|\b0 /);
    const d = listingDescription(['Hackathon presencial en Rosario de shippear.'], 'finished', `${fw.text}.`);
    assert.ok(d.endsWith(`${fw.text}.`), d);
    assert.match(d, n === 0 ? /Mirá los hackathons abiertos en LatAm\.$/ : n === 1 ? /Mirá el hackathon abierto en Argentina\.$/ : new RegExp(`Mirá los ${n} hackathons abiertos en Argentina\\.$`));
  }
  assert.equal(wayForward(L({ type: 'bounty', modality: 'online' }), () => 3).href, '/bounties');
  assert.match(listingDescription(['Bounty virtual.'], 'finished', null, 'bounty'), /^Bounty finalizado\./);
  assert.doesNotMatch(listingTitle(shippear, { now, prize: null, date: null }), /finalizada/);
});

test('registration closed but event not over: "inscripción cerrada", not "finalizado"', () => {
  const l = L({ title: 'Hack Rosario', city: 'Rosario', deadlineAt: '2026-10-20T12:00:00Z', startsAt: '2026-11-02T12:00:00Z' });
  assert.equal(listingState(l, now), 'regClosed');
  assert.equal(listingTitle(l, { now, prize: null, date: null }), 'Hack Rosario Hackathon 2026 — inscripción cerrada | Condor Nest');
});

test('hub title: real count, 1 abierto / N abiertos, never "0 abiertos"', () => {
  const ar = hubBySlug('hackathons-argentina')!;
  assert.equal(hubTitle(ar, 5, 0, now), 'Hackathons en Argentina 2026: 5 abiertos, premios y cierres | Condor Nest');
  assert.equal(hubTitle(ar, 1, 0, now), 'Hackathons en Argentina 2026: 1 abierto, premios y cierres | Condor Nest');
  assert.equal(hubTitle(ar, 0, 3, now), 'Hackathons en Argentina 2026: abiertos a LatAm | Condor Nest');
  assert.equal(hubTitle(ar, 0, 0, now), 'Hackathons en Argentina 2026: premios y cierres | Condor Nest');
  const b = hubBySlug('bounties')!;
  assert.equal(hubTitle(b, 12, 0, now), 'Bounties para builders de LatAm 2026: 12 abiertos | Condor Nest');
  for (const t of [hubTitle(ar, 5, 0, now), hubTitle(b, 12, 0, now)]) assert.ok(t.replace(' | Condor Nest', '').length <= TITLE_MAX);
});

test('hub description: count, next one, ≤155', () => {
  const ar = hubBySlug('hackathons-argentina')!;
  const d = hubDescription(ar, 5, 0, 'inicio', { title: 'Hackatón Córdoba', date: '7/11' });
  assert.equal(d, '5 hackathons abiertos en Argentina. Premio, elegibilidad y fecha de inicio en tu hora. El próximo: Hackatón Córdoba (7/11). Actualizado todos los días.');
  assert.ok(d.length <= 155);
  assert.match(hubDescription(ar, 1, 0, 'inicio', null), /^1 hackathon abierto en Argentina\./);
  assert.match(hubDescription(ar, 0, 2, 'inicio', null), /^Hoy no hay hackathons abiertos solo en Argentina: te mostramos 2 abiertos a LatAm\./);
  assert.doesNotMatch(hubDescription(ar, 0, 0, 'inicio', null), /\b0\b/);
});

test('finished uses the same close rules as lib/dates.ts (online no end never finished; in person no end = 23:59 local of start day)', () => {
  // Stranger Builds: online, starts 2026-10-31 14:01 ART, no end, no close.
  const sb = L({ slug: 'stranger-builds', modality: 'online', city: null, startsAt: '2026-10-31T17:01:00Z', endsAt: null, deadlineAt: null });
  for (const t of ['2026-10-31T17:01:00Z', '2026-11-01T03:00:00Z', '2026-11-07T17:01:00Z', '2027-01-01T00:00:00Z']) {
    assert.equal(isFinished(sb, new Date(t)), false, t);
    assert.notEqual(listingState(sb, new Date(t)), 'finished', t);
  }
  assert.doesNotMatch(listingTitle(sb, { now: new Date('2026-11-07T17:01:00Z'), prize: null, date: null }), /finalizad/);
  // In person, no end: finished only after 23:59:59 of the start day in the city's zone (Rosario → Córdoba time).
  const irl = L({ modality: 'irl', city: 'Rosario', startsAt: '2026-11-07T13:00:00Z', endsAt: null, deadlineAt: null });
  assert.equal(isFinished(irl, new Date('2026-11-08T02:59:59Z')), false); // 23:59:59 ART
  assert.equal(isFinished(irl, new Date('2026-11-08T03:00:00Z')), true);
  // Known other-zone city: CDMX (UTC-6) day ends later in UTC.
  const mx = L({ modality: 'irl', city: 'Ciudad de México', startsAt: '2026-11-07T16:00:00Z', endsAt: null, deadlineAt: null });
  assert.equal(isFinished(mx, new Date('2026-11-08T05:59:00Z')), false);
  assert.equal(isFinished(mx, new Date('2026-11-08T06:00:01Z')), true);
  // Date-only end counts to 23:59:59 local.
  const dOnly = L({ modality: 'irl', city: 'Córdoba', startsAt: null, startDate: '2026-11-14', endsAt: null, endDate: '2026-11-15', deadlineAt: null });
  assert.equal(isFinished(dOnly, new Date('2026-11-16T02:59:00Z')), false);
  assert.equal(isFinished(dOnly, new Date('2026-11-16T03:00:00Z')), true);
  // Real ones stay finished.
  assert.equal(isFinished(shippear, now), true);
  assert.equal(isFinished(openPayments, now), true);
  assert.equal(listingState(shippear, now), 'finished');
  assert.equal(listingState(openPayments, now), 'finished');
});
