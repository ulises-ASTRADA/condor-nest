import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { artShort, srDate } from './format.ts';
(globalThis as any).React = React;
const load = async () => (await import('../components/Countdown.tsx')).Countdown;

// The countdown's sr-only sentence must name the same day, time and zone as the visible date beside it
// (both use the viewer's zone via useTz; SSR/first paint = Córdoba). Cases where the day changes by zone.
const FRONTIER = { type: 'hackathon', modality: 'irl', city: 'Ciudad de México', deadlineAt: '2026-10-31T05:59:00Z', startsAt: null }; // 30/10 23:59 CDMX = 31/10 02:59 Córdoba
const RAPTORX = { type: 'bounty', modality: 'online', city: null, deadlineAt: '2026-11-02T03:59:59Z', startsAt: null }; // 02/11 00:59 Córdoba = 01/11 21:59 CDMX

const parts = (html: string) => ({
  sr: html.match(/<span class="sr-only">([^<]*)<\/span>/)?.[1],
  visible: html.match(/<span class="basis-full text-fg-muted">([^<]*)<\/span>/)?.[1],
});

test('Countdown Frontier CDMX: sr-only and visible date agree (same day across the midnight zone change)', async () => {
  const Countdown = await load();
  const { sr, visible } = parts(renderToStaticMarkup(createElement(Countdown, { l: FRONTIER as any, initialNow: '2026-10-27T18:30:00Z', registrationOnly: true })));
  assert.equal(visible, 'sáb 31/10 · 02:59 GMT-3');
  assert.equal(sr, 'Cierra el sábado 31 de octubre a las 02:59, hora de Córdoba (GMT-3).');
});

test('Countdown st-raptorx (online): sr-only and visible date agree', async () => {
  const Countdown = await load();
  const { sr, visible } = parts(renderToStaticMarkup(createElement(Countdown, { l: RAPTORX as any, initialNow: '2026-10-27T18:30:00Z', registrationOnly: true })));
  assert.equal(visible, 'lun 02/11 · 00:59 GMT-3');
  assert.equal(sr, 'Cierra el lunes 2 de noviembre a las 00:59, hora de Córdoba (GMT-3).');
});

test('srDate and artShort name the same day and time in every viewer zone, also when the day changes', () => {
  const cases: [string, string, string, RegExp][] = [
    [FRONTIER.deadlineAt, 'America/Mexico_City', 'vie 30/10 · 23:59 GMT-6', /^Cierra el viernes 30 de octubre a las 23:59, hora de Ciudad de México \(GMT-6\)\.$/],
    [FRONTIER.deadlineAt, 'America/Lima', 'sáb 31/10 · 00:59 GMT-5', /^Cierra el sábado 31 de octubre a las 00:59, hora de Lima \(GMT-5\)\.$/],
    [FRONTIER.deadlineAt, 'UTC', 'sáb 31/10 · 05:59 GMT', /^Cierra el sábado 31 de octubre a las 05:59, hora UTC \(GMT\)\.$/],
    [RAPTORX.deadlineAt, 'America/Mexico_City', 'dom 01/11 · 21:59 GMT-6', /^Cierra el domingo 1 de noviembre a las 21:59, hora de Ciudad de México \(GMT-6\)\.$/],
    [RAPTORX.deadlineAt, 'America/Argentina/Cordoba', 'lun 02/11 · 00:59 GMT-3', /^Cierra el lunes 2 de noviembre a las 00:59, hora de Córdoba \(GMT-3\)\.$/],
  ];
  for (const [iso, tz, short, long] of cases) {
    assert.equal(artShort(iso, tz), short, tz);
    assert.match(srDate(iso, 'Cierra', tz), long, tz);
  }
});
