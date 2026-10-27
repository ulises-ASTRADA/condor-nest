import { test } from 'node:test';
import assert from 'node:assert/strict';
import { artShort, artFull, hhmm, srDate, TZ } from './format.ts';

// es-AR + hour12:false resolves to hourCycle 'h24' in Node/Chrome ICU, which prints 00:59 as "24:59".
// Every formatter must use hours 00-23 in the listing's zone.
const ST_RAPTORX = '2026-11-02T03:59:59Z'; // stored deadline_at = lunes 2/11 00:59:59 in Córdoba (GMT-3)

test('times just after midnight in Córdoba print 00:xx, never 24:xx (sr-only and visible formatters)', () => {
  assert.equal(srDate(ST_RAPTORX), 'Cierra el lunes 2 de noviembre a las 00:59, hora de Córdoba (GMT-3).');
  assert.equal(artShort(ST_RAPTORX), 'lun 02/11 · 00:59 GMT-3');
  assert.equal(hhmm(ST_RAPTORX), '00:59');
  assert.match(artFull(ST_RAPTORX), /^02\/11\/2026,? 00:59 GMT-3$/);
  assert.equal(hhmm('2026-11-02T03:00:00Z'), '00:00');
});

test('times around midnight: 23:59 stays the previous day, 00:00 rolls to the next day; other zones too', () => {
  assert.equal(srDate('2026-11-02T02:59:00Z'), 'Cierra el domingo 1 de noviembre a las 23:59, hora de Córdoba (GMT-3).');
  assert.equal(srDate('2026-11-02T03:00:00Z', 'Empieza'), 'Empieza el lunes 2 de noviembre a las 00:00, hora de Córdoba (GMT-3).');
  assert.equal(artShort('2026-11-02T12:30:00Z'), 'lun 02/11 · 09:30 GMT-3');
  assert.equal(hhmm('2026-11-02T00:15:00Z', 'UTC'), '00:15');
  assert.equal(hhmm('2026-11-02T05:05:00Z', 'America/Lima'), '00:05');
  for (let m = 0; m < 24 * 60; m += 7) {
    const iso = new Date(Date.UTC(2026, 10, 2, 3, 0) + m * 6e4).toISOString();
    const h = Number(hhmm(iso, TZ).slice(0, 2));
    assert.ok(h >= 0 && h <= 23, `${iso} -> ${hhmm(iso, TZ)}`);
    assert.equal(h, Math.floor(m / 60));
  }
});
