import { test } from 'node:test';
import assert from 'node:assert/strict';
import { regPill } from './format.ts';
const tz = 'America/Argentina/Buenos_Aires';
const dl = '2026-10-23T02:59:00Z'; // 22/10 23:59 ART
const at = (iso: string) => regPill({ deadlineAt: dl }, new Date(iso), tz);
test('no deadline, no pill', () => assert.equal(regPill({ deadlineAt: null }, new Date(), tz), null));
test('more than 7 days: nothing', () => assert.equal(at('2026-10-14T12:00:00Z'), null));
test('7 days: soft', () => assert.deepEqual([at('2026-10-15T12:00:00Z')!.kind, at('2026-10-15T12:00:00Z')!.days], ['soft', 7]));
test('3 days: soft', () => assert.equal(at('2026-10-19T12:00:00Z')!.kind, 'soft'));
test('2 days: urgent', () => assert.deepEqual([at('2026-10-20T22:00:00Z')!.kind, at('2026-10-20T22:00:00Z')!.days, at('2026-10-20T22:00:00Z')!.date], ['urgent', 2, '22/10']));
test('late night 21/10 ART is still 1 day', () => assert.equal(at('2026-10-22T02:30:00Z')!.days, 1));
test('last day shows close time', () => { const p = at('2026-10-22T15:00:00Z')!; assert.equal(p.kind, 'last'); assert.equal(p.time, '23:59'); });
test('closed after cutoff, never negative', () => { const p = at('2026-10-23T03:00:00Z')!; assert.equal(p.kind, 'closed'); assert.equal(p.days, 0); });
