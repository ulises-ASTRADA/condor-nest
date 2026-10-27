import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
(globalThis as any).React = React; // tsx compiles JSX with the classic runtime (tsconfig jsx: preserve is for Next)
const load = async () => (await import('../components/Countdown.tsx')).Countdown;

const l: any = { type: 'hackathon', modality: 'online', deadlineAt: null, startsAt: '2026-10-31T17:00:00Z', endsAt: null, statusNote: '7 días para entregar desde el 31/10' };
test('Countdown (Stranger Builds, now 2026-10-31T17:01Z): green En curso pill with the note, no "cerrada"', async () => {
  const Countdown = await load();
  const html = renderToStaticMarkup(createElement(Countdown, { l, initialNow: '2026-10-31T17:01:00Z', registrationOnly: true }));
  assert.match(html, /dl-pill--live/);
  assert.match(html, /En curso · 7 días para entregar desde el 31\/10/);
  assert.doesNotMatch(html, /errad/i);
});
test('Countdown date-only close: day plus "Hora a confirmar", no hour', async () => {
  const Countdown = await load();
  const html = renderToStaticMarkup(createElement(Countdown, { l: { type: 'hackathon', modality: 'online', deadlineAt: null, startsAt: null, deadlineDate: '2026-11-01' }, initialNow: '2026-10-27T05:00:00Z', registrationOnly: true }));
  assert.match(html, /Cierra el 1 de noviembre<\/span> · Hora a confirmar/);
  assert.doesNotMatch(html, /\d{2}:\d{2}/);
});
test('Countdown online started, no end, no note, after start day: grey "Empezó el 9 de noviembre · Fin a confirmar", no green pill', async () => {
  const Countdown = await load();
  const html = renderToStaticMarkup(createElement(Countdown, { l: { type: 'hackathon', modality: 'online', deadlineAt: null, startsAt: '2026-11-09T17:30:00Z', endsAt: null }, initialNow: '2026-11-12T12:00:00Z', registrationOnly: true }));
  assert.match(html, /text-fg-muted/);
  assert.match(html, /Empezó el 9 de noviembre · Fin a confirmar/);
  assert.doesNotMatch(html, /dl-pill--live/);
});
