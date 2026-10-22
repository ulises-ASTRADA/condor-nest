import test from 'node:test';
import assert from 'node:assert/strict';
import { mapLocation } from './map-location';

test('addresses and full Maps links produce a real map query', () => {
  assert.match(mapLocation('Lucerna 34, CDMX')!.embedUrl!, /q=Lucerna%2034%2C%20CDMX/);
  assert.match(mapLocation('https://www.google.com/maps/search/?api=1&query=Lucerna+34')!.embedUrl!, /q=Lucerna%2034/);
  assert.match(mapLocation('https://www.google.com/maps/place/Lucerna+34/')!.embedUrl!, /q=Lucerna%2034/);
  assert.ok(mapLocation('https://www.google.com.ar/maps?q=CDMX')?.embedUrl);
});
test('short Maps links remain usable without a fabricated map location', () => {
  assert.deepEqual(mapLocation('https://maps.app.goo.gl/example'), { href: 'https://maps.app.goo.gl/example', embedUrl: null });
  assert.deepEqual(mapLocation('https://goo.gl/maps/example'), { href: 'https://goo.gl/maps/example', embedUrl: null });
});
test('unsafe protocols and non-Maps URLs cannot become map links or frames', () => {
  for (const value of ['', 'javascript:alert(1)', 'https://example.com/maps', 'https://google.com.evil.test/maps?q=CDMX', 'https://www.google.com/search?q=CDMX', 'https://user:pass@www.google.com/maps?q=CDMX', '//evil.test']) assert.equal(mapLocation(value), null);
});
