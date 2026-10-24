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
  assert.equal(content.name, 'Condor Nest · 2026-10-26');
});
