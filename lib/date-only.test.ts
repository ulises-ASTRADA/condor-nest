import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isOpen } from './rank.ts';
import { eventLd } from './jsonld.ts';
import { fromRow } from './types.ts';
import { closeDisplay, closeLine, isLive, liveLabel, ymdOrNull, ymdShort, ymdLong } from './dates.ts';

const base: any = { country: null, eligibilityShort: null, rewardText: null, id: 'x', slug: 'x', type: 'hackathon', title: 't', organizer: null, source: 'manual', sourceUrl: 'https://example.org', rewardAmount: null, rewardCurrency: 'USD', rewardUsd: null, rewardKind: null, deadlineAt: null, startsAt: null, endsAt: null, startDate: null, endDate: null, deadlineDate: null, statusNote: null, competitors: null, competitorsKind: null, eligibility: 'global', eligibilityNote: null, modality: 'online', city: null, ecosystems: [], summaryEs: null, featured: false, featuredUntil: null, disclosureKey: null, updatedAt: '', createdAt: '2026-10-27T05:00:00Z', titleLang: 'en', applyUrl: 'https://example.org/apply', sourcePostUrl: null, verifiedUrl: null, curated: true, venue: null, venueLocality: null };
const L = (o: any) => ({ ...base, ...o });

// Stranger Builds (92b5e56f…): online, starts 31/10 17:00 UTC, no deadline, no end; "seven days online to ship" with no published date.
const stranger = L({ slug: 'stranger-builds-online-2026', startsAt: '2026-10-31T17:00:00Z', statusNote: '7 días para entregar desde el 31/10' });
test('Stranger Builds at 2026-10-31T17:01Z: not closed, En curso with the data note, JSON-LD without endDate', () => {
  for (const at of ['2026-10-31T17:01:00Z', '2026-11-03T12:00:00Z', '2026-11-08T12:00:00Z']) {
    const now = new Date(at);
    assert.equal(isOpen(stranger, now), true, at);
    assert.equal(isLive(stranger, now), true, at);
  }
  assert.equal(liveLabel(stranger), 'En curso · 7 días para entregar desde el 31/10');
  assert.equal(liveLabel({ ...stranger, statusNote: null }), 'En curso');
  const ev = eventLd(stranger, null, new Date('2026-10-31T17:01:00Z')) as any;
  assert.equal(ev.startDate, '2026-10-31T17:00:00Z');
  assert.equal('endDate' in ev, false);
  assert.equal(ev.offers.availability, 'https://schema.org/InStock');
});
test('Stranger Builds before start is not En curso', () => assert.equal(isLive(stranger, new Date('2026-10-31T16:59:00Z')), false));
test('a published end or close disables En curso', () => {
  const now = new Date('2026-11-01T00:00:00Z');
  assert.equal(isLive({ ...stranger, endsAt: '2026-11-07T23:59:00Z' }, now), false);
  assert.equal(isLive({ ...stranger, deadlineDate: '2026-11-05' }, now), false);
});
test('in person with no end: En curso only through the start day (Córdoba), then closed', () => {
  const h = L({ modality: 'irl', city: 'Ciudad de México', startsAt: '2026-10-27T21:00:00Z' });
  assert.equal(isOpen(h, new Date('2026-10-28T02:30:00Z')), true); // 27/10 23:30 ART
  assert.equal(isOpen(h, new Date('2026-10-28T03:00:01Z')), false);
});
test('JSON-LD: no endDate when no end is published (old start-as-end fallback removed)', () => {
  const ev = eventLd(L({ startsAt: '2099-01-02T12:00:00Z' })) as any;
  assert.equal('endDate' in ev, false);
  assert.equal((eventLd(L({ startsAt: '2099-01-02T12:00:00Z', endsAt: '2099-01-03T12:00:00Z' })) as any).endDate, '2099-01-03T12:00:00Z');
});

// Frontier CDMX: in person, close 30/10 23:59 CDMX = 2026-10-31T05:59Z, event day published without hour.
const frontier = L({ modality: 'irl', city: 'Ciudad de México', deadlineAt: '2026-10-31T05:59:00Z', startDate: '2026-10-31' });
test('Frontier: close in CDMX local time; title day is 30 de octubre', () => {
  assert.equal(closeLine(frontier, true), 'Cierra el 30 de octubre, 23:59 (hora de CDMX)');
  assert.equal(closeDisplay(frontier)!.day, '30 de octubre');
});
test('online close keeps Córdoba time, labeled hora de Argentina', () => {
  assert.equal(closeLine(L({ deadlineAt: '2026-10-31T05:59:00Z' }), true), 'Cierra el 31 de octubre, 02:59 (hora de Argentina)');
});
test('date-only start: JSON-LD plain dates, never an hour', () => {
  const ev = eventLd(frontier, null, new Date('2026-10-27T05:00:00Z')) as any;
  assert.equal(ev.startDate, '2026-10-31');
  assert.equal('endDate' in ev, false);
  const dev3 = eventLd(L({ modality: 'hybrid', startDate: '2026-11-27', endDate: '2026-11-29' })) as any;
  assert.deepEqual([dev3.startDate, dev3.endDate], ['2026-11-27', '2026-11-29']);
  assert.equal(ymdShort('2026-10-31'), '31 oct');
  assert.equal(ymdLong('2026-10-31'), '31 de octubre');
});
// Machine-Checked: "Applications close 1 November 2026", no hour.
const mc = L({ deadlineDate: '2026-11-01', startDate: '2026-11-02', endsAt: '2026-11-07T23:59:00Z' });
test('date-only close: "Hora a confirmar", open until the end of that day in Córdoba', () => {
  assert.equal(closeLine(mc, true), 'Cierra el 1 de noviembre · Hora a confirmar');
  assert.equal(isOpen(mc, new Date('2026-11-02T02:59:00Z')), true);
  assert.equal(isOpen(mc, new Date('2026-11-02T03:00:01Z')), false);
  const ev = eventLd(mc, null, new Date('2026-10-27T05:00:00Z')) as any;
  assert.equal(ev.offers.validThrough, '2026-11-01');
  assert.equal(ev.offers.availability, 'https://schema.org/InStock');
});
test('fromRow: date-only values validated and used only when the timestamp is null', () => {
  const row = { ...Object.fromEntries(Object.keys(base).map((k) => [k, null])), source_url: 'https://example.org', ecosystems: [] };
  const r = fromRow({ ...row, start_date: '2026-10-31', end_date: '2026-02-30', deadline_date: '2026-11-01', deadline_at: '2026-10-31T05:59:00Z', status_note: '  x ' });
  assert.deepEqual([r.startDate, r.endDate, r.deadlineDate, r.statusNote], ['2026-10-31', null, null, 'x']);
  assert.equal(ymdOrNull('31/10/2026'), null);
});
