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
test('type + IRL filters', () => {
  assert.equal(matches(L({}), { ...DEFAULT_FILTERS, tipos: ['hackathon'] }, now), false);
  assert.equal(matches(L({ modality: 'irl' }), { ...DEFAULT_FILTERS, modalidades: ['irl'] }, now), true);
  assert.equal(matches(L({ modality: 'online' }), { ...DEFAULT_FILTERS, modalidades: ['irl'] }, now), false);
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
