import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventLd } from './jsonld.ts';
import { parseVenues, venueQuery, venueText } from './venues.ts';

const base = {
  id: 'af90a89b-2a62-4a75-b8fb-a85f84aff56a', slug: 'hacktoberfest-mexico-2026', type: 'hackathon', title: 'Hacktoberfest México 2026', organizer: null, source: 'x',
  sourceUrl: 'https://hacktoberfest.mobil3.xyz/', rewardAmount: null, rewardCurrency: null, rewardUsd: null, rewardText: null, rewardKind: null,
  deadlineAt: null, startsAt: '2099-10-27T21:00:00Z', endsAt: '2099-10-29T01:00:00Z', competitors: null, competitorsKind: null, eligibility: 'unknown',
  eligibilityNote: null, eligibilityShort: null, modality: 'irl', city: 'Ciudad de México', ecosystems: [], summaryEs: null, featured: false, featuredUntil: null,
  disclosureKey: null, updatedAt: '2026-10-27T00:00:00Z', createdAt: '2026-10-20T00:00:00Z', titleLang: 'es', applyUrl: 'https://hacktoberfest.mobil3.xyz/',
  sourcePostUrl: null, verifiedUrl: 'https://hacktoberfest.mobil3.xyz/', curated: true, country: 'MX', venue: 'Lucerna 34', venueLocality: 'Lucerna 34, Juárez',
} as any;
const RAW = [
  { label: 'Día 1', name: 'Lucerna 34', street: 'Lucerna 34, Juárez', locality: 'Ciudad de México' },
  { label: 'Día 2', name: 'Sandbox Hub', street: 'Luis G. Urbina 4, Polanco', locality: 'Ciudad de México' },
];

test('multi-venue JSON-LD: location is an array of one Place per day, each with its own PostalAddress', () => {
  const ev = eventLd(base, null, parseVenues(RAW)) as any;
  assert.deepEqual(ev.location, [
    { '@type': 'Place', name: 'Lucerna 34', address: { '@type': 'PostalAddress', streetAddress: 'Lucerna 34, Juárez', addressLocality: 'Ciudad de México', addressCountry: 'MX' } },
    { '@type': 'Place', name: 'Sandbox Hub', address: { '@type': 'PostalAddress', streetAddress: 'Luis G. Urbina 4, Polanco', addressLocality: 'Ciudad de México', addressCountry: 'MX' } },
  ]);
  assert.ok(!JSON.stringify(ev.location).includes('('));
});

test('multi-venue JSON-LD: hybrid keeps the VirtualLocation after the places; online ignores venues', () => {
  const hy = eventLd({ ...base, modality: 'hybrid' }, null, parseVenues(RAW)) as any;
  assert.deepEqual(hy.location.map((x: any) => x['@type']), ['Place', 'Place', 'VirtualLocation']);
  const on = eventLd({ ...base, modality: 'online' }, null, parseVenues(RAW)) as any;
  assert.equal(on.location['@type'], 'VirtualLocation');
});

test('without raw.venues (or with fewer than two valid ones) JSON-LD is the single Place exactly as before', () => {
  const before = eventLd(base) as any;
  assert.deepEqual(before.location, { '@type': 'Place', name: 'Lucerna 34', address: { '@type': 'PostalAddress', streetAddress: 'Lucerna 34, Juárez', addressLocality: 'Ciudad de México', addressCountry: 'MX' } });
  for (const raw of [null, undefined, {}, 'x', [], [RAW[0]], [RAW[0], { label: 'Día 2', name: 'Sandbox Hub' }]]) {
    assert.equal(parseVenues(raw), null);
    assert.deepEqual(eventLd(base, null, parseVenues(raw)), before);
  }
  // Pre-update DB row (venue with a note in parentheses, no raw.venues): unchanged single Place.
  const old = eventLd({ ...base, venue: 'Lucerna 34 (kickoff del día 1)' }) as any;
  assert.equal(old.location.name, 'Lucerna 34 (kickoff del día 1)');
});

test('venue rows and Maps queries: address only, no parentheses', () => {
  const [d1, d2] = parseVenues(RAW)!;
  assert.equal(venueText(d1), 'Lucerna 34, Juárez, Ciudad de México');
  assert.equal(venueText(d2), 'Sandbox Hub, Luis G. Urbina 4, Polanco, Ciudad de México');
  assert.equal(venueQuery(d1, 'México'), 'Lucerna 34, Juárez, Ciudad de México, México');
  assert.equal(venueQuery(d2, 'México'), 'Luis G. Urbina 4, Polanco, Ciudad de México, México');
  assert.equal(venueQuery({ ...d1, street: 'Lucerna 34 (kickoff del día 1), Juárez' }), 'Lucerna 34, Juárez, Ciudad de México');
});
