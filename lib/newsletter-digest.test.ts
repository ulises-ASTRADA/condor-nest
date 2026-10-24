import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { Listing } from './types';
import { digestContent, nextMondayIssueDate, selectDigestListings } from './newsletter-digest';

const listing = (overrides: Partial<Listing> = {}): Listing => ({
  slug: 'demo', title: 'Demo <evento>', type: 'hackathon', modality: 'online',
  eligibility: 'latam', applyUrl: 'https://example.com/apply', deadlineAt: '2026-10-30T20:00:00Z',
  startsAt: null, ...overrides,
} as Listing);

test('draft date is the next Monday in Argentina', () => {
  assert.equal(nextMondayIssueDate(new Date('2026-10-25T12:00:00Z')), '2026-10-26');
  assert.equal(nextMondayIssueDate(new Date('2026-10-26T12:00:00Z')), '2026-11-02');
});

test('weekly selection excludes expired, unverified access, and missing application links', () => {
  const selected = selectDigestListings([
    listing({ slug: 'expired', deadlineAt: '2026-10-25T20:00:00Z' }),
    listing({ slug: 'unknown', eligibility: 'unknown' }),
    listing({ slug: 'no-apply', applyUrl: null }),
    listing({ slug: 'other-country', eligibility: 'restricted', country: 'MX' }),
    listing({ slug: 'later', deadlineAt: '2026-11-10T20:00:00Z' }),
    listing({ slug: 'soon' }),
  ], '2026-10-26');
  assert.deepEqual(selected.map((item) => item.slug), ['soon', 'later']);
});

test('HTML escapes listing text and provides Resend unsubscribe plus campaign links', () => {
  const content = digestContent([listing()], '2026-10-26');
  assert.match(content.html, /Demo &lt;evento&gt;/);
  assert.match(content.html, /utm_campaign=2026-10-26/);
  assert.match(content.html, /\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/);
  assert.match(content.html, /email\/condor-nest-firma\.png/);
  assert.match(content.html, /background:#07080b/);
  assert.match(content.html, /Space Grotesk/);
  assert.match(content.html, /Nuestra primera semana juntos/);
  assert.match(content.html, /265/);
  assert.match(content.text, /677 páginas vistas/);
  assert.equal(content.name, 'Condor Nest · 2026-10-26');
});

test('first-week snapshot is not repeated in later editions', () => {
  const content = digestContent([listing({ deadlineAt: '2026-11-06T20:00:00Z' })], '2026-11-02');
  assert.doesNotMatch(content.html, /265/);
  assert.match(content.html, /Gracias por ser parte de Condor Nest/);
});

test('active page highlights appear first and disappear after their featured week', () => {
  const selected = selectDigestListings([
    listing({ slug: 'regular', deadlineAt: '2026-10-27T20:00:00Z' }),
    listing({ slug: 'feature', featured: true, featuredUntil: '2026-10-30T20:00:00Z', deadlineAt: '2026-11-10T20:00:00Z' }),
    listing({ slug: 'old-feature', featured: true, featuredUntil: '2026-10-25T20:00:00Z' }),
  ], '2026-10-26');
  assert.deepEqual(selected.map((item) => item.slug), ['feature', 'regular']);
  const content = digestContent(selected, '2026-10-26');
  assert.ok(content.html.indexOf('★ DESTACADO') < content.html.indexOf('Demo &lt;evento&gt;'));
});
