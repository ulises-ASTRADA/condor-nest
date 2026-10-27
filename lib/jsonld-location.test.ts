import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventLd, ldScript } from './jsonld.ts';

// Shapes of the two Flowcheck cases (2026-10-27), taken from the live rows: Dev3pack (hybrid, no city/venue) and Machine-Checked (online).
const dev3pack = {
  id: 'd3p', slug: 'dev3pack-global-hackathon-2026', type: 'hackathon', title: 'Dev3pack Global Hackathon', organizer: null, source: 'x',
  sourceUrl: 'https://hack.dev3pack.xyz/', rewardAmount: null, rewardCurrency: null, rewardUsd: null, rewardText: null, rewardKind: null,
  deadlineAt: null, startsAt: null, endsAt: null, startDate: '2026-11-27', endDate: '2026-11-29', deadlineDate: null, statusNote: null,
  competitors: null, competitorsKind: null, eligibility: 'unknown', eligibilityNote: null, eligibilityShort: null, modality: 'hybrid', city: null,
  ecosystems: [], summaryEs: null, featured: false, featuredUntil: null, disclosureKey: null, updatedAt: '2026-10-27T00:00:00Z', createdAt: '2026-10-20T00:00:00Z',
  titleLang: 'en', applyUrl: 'https://app.dev3pack.xyz/hackathon/register', sourcePostUrl: null, verifiedUrl: 'https://hack.dev3pack.xyz/', curated: true,
  country: null, venue: null, venueLocality: null,
} as any;
const now = new Date('2026-10-27T18:00:00Z');

test('JSON-LD location: hybrid with no venue -> VirtualLocation on source_url (never null/missing), mode stays Mixed', () => {
  const ev = eventLd(dev3pack, null, now) as any;
  assert.deepEqual(ev.location, { '@type': 'VirtualLocation', url: 'https://hack.dev3pack.xyz/' });
  assert.equal(ev.eventAttendanceMode, 'https://schema.org/MixedEventAttendanceMode');
  assert.equal(ev.startDate, '2026-11-27'); assert.equal(ev.endDate, '2026-11-29');
});

test('JSON-LD location: online uses source_url first, apply_url as fallback, https only; no URL -> no location key (not null)', () => {
  const on = { ...dev3pack, modality: 'online' };
  const a = eventLd(on, null, now) as any;
  assert.deepEqual(a.location, { '@type': 'VirtualLocation', url: 'https://hack.dev3pack.xyz/' });
  assert.equal(a.eventAttendanceMode, 'https://schema.org/OnlineEventAttendanceMode');
  const b = eventLd({ ...on, sourceUrl: '' }, null, now) as any;
  assert.equal(b.location.url, 'https://app.dev3pack.xyz/hackathon/register');
  const c = eventLd({ ...on, sourceUrl: 'javascript:alert(1)', applyUrl: 'http://insecure.example/' }, null, now) as any;
  assert.equal('location' in c, false);
  assert.ok(!JSON.stringify(c).includes('"location":null'));
});

test('JSON-LD location: hybrid with a city keeps [Place, VirtualLocation]; irl with no place has no location key', () => {
  const hy = eventLd({ ...dev3pack, city: 'Rosario', country: 'AR' }, null, now) as any;
  assert.deepEqual(hy.location.map((x: any) => x['@type']), ['Place', 'VirtualLocation']);
  const irl = eventLd({ ...dev3pack, modality: 'irl' }, null, now) as any;
  assert.equal('location' in irl, false);
  assert.equal(irl.eventAttendanceMode, 'https://schema.org/OfflineEventAttendanceMode');
});

test('JSON-LD stays escaped: "<" in data never closes the script tag', () => {
  const html = ldScript(eventLd({ ...dev3pack, title: '</script><script>alert(1)</script>' }, null, now)).__html;
  assert.ok(!html.includes('</script'));
  assert.ok(html.includes('\\u003c/script>'));
});
