import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refPath, goFallback, VALID_SLUG, goPath, GO_GONE_HTML } from './go.ts';

test('refPath: condor-nest referers keep the pathname only', () => {
  assert.equal(refPath('https://condor-nest.lat/o/hackatwin-2026', 'condor-nest.lat'), '/o/hackatwin-2026');
  assert.equal(refPath('https://www.condor-nest.lat/hackathons-argentina?utm_source=x#faq', 'condor-nest.lat'), '/hackathons-argentina');
  assert.equal(refPath('https://condor-nest.lat/', 'condor-nest.lat'), '/');
  assert.equal(refPath('https://condor-nest.lat', 'x'), '/');
});
test('refPath: same host as the request (previews, localhost)', () => {
  assert.equal(refPath('https://condor-nest-abc.vercel.app/o/x', 'condor-nest-abc.vercel.app'), '/o/x');
  assert.equal(refPath('http://localhost:3100/o/x', 'localhost:3100'), '/o/x');
  assert.equal(refPath('http://localhost:3999/o/x', 'localhost:3100'), null);
});
test('refPath: other sites and junk are null', () => {
  assert.equal(refPath('https://google.com/search?q=x', 'condor-nest.lat'), null);
  assert.equal(refPath('https://condor-nest.lat.evil.com/o/x', 'condor-nest.lat'), null);
  assert.equal(refPath('https://evil.com/o/x', null), null);
  assert.equal(refPath('javascript:alert(1)', 'condor-nest.lat'), null);
  assert.equal(refPath('not a url', 'condor-nest.lat'), null);
  assert.equal(refPath(null, 'condor-nest.lat'), null);
  assert.equal(refPath('https://condor-nest.lat/o/caf%C3%A9', 'condor-nest.lat'), null);
  assert.equal(refPath('https://condor-nest.lat/' + 'a'.repeat(200), 'condor-nest.lat'), null);
  assert.equal(refPath('https://condor-nest.lat/' + 'a'.repeat(199), 'condor-nest.lat')?.length, 200);
});
test('goFallback: same-origin only', () => {
  assert.equal(goFallback('dp-hack-1', true), '/o/dp-hack-1');
  assert.equal(goFallback('dp-hack-1', false), null);
  assert.equal(goFallback('//evil.com', true), null);
  assert.equal(goFallback('../x', true), null);
});
test('GO_GONE_HTML: styled 404 copy, noindex, button to / only', () => {
  assert.match(GO_GONE_HTML, /Esta convocatoria ya no está publicada/);
  assert.match(GO_GONE_HTML, /<a href="\/">Ver convocatorias abiertas<\/a>/);
  assert.match(GO_GONE_HTML, /noindex/);
  assert.doesNotMatch(GO_GONE_HTML, /<script|https?:\/\//);
  assert.equal((GO_GONE_HTML.match(/<a /g) ?? []).length, 1);
});
test('VALID_SLUG and goPath', () => {
  assert.ok(VALID_SLUG.test('st-foo_bar-2026'));
  for (const bad of ['', '../x', 'a/b', 'a.b', '%2F', 'x'.repeat(201)]) assert.ok(!VALID_SLUG.test(bad), bad);
  assert.equal(goPath('a b'), '/go/a%20b');
});
