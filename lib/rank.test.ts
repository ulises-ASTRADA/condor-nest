import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortListings, competitionScore, matches, DEFAULT_FILTERS } from './rank.ts';
import { sig2, deadlineInfo } from './format.ts';
const base: any = { id: 'x', slug: 'x', type: 'bounty', title: 't', organizer: null, source: 'superteam', sourceUrl: 'u', rewardAmount: null, rewardCurrency: 'USD', rewardUsd: null, rewardKind: null, deadlineAt: '2099-01-01T00:00:00Z', startsAt: null, endsAt: null, competitors: null, competitorsKind: 'submissions', eligibility: 'global', eligibilityNote: null, modality: 'online', city: null, ecosystems: [], summaryEs: null, featured: false, featuredUntil: null, disclosureKey: null, updatedAt: '', createdAt: '2026-01-01', titleLang: 'en', applyUrl: null, sourcePostUrl: null, verifiedUrl: null, curated: false };
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
