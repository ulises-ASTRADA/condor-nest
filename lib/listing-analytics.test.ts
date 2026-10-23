import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsBot, analyticsEnabled, listingEvents, publicAnalyticsPath } from './listing-analytics';
const base = { id: '11111111-1111-4111-8111-111111111111', kind: 'impression', slug: 'hackathon-demo', path: '/', placement: 'featured', position: 1, exposure: '22222222-2222-4222-8222-222222222222' };
test('public funnel accepts only public paths and strips all unrequested fields', () => {
  assert.deepEqual(listingEvents([{ ...base, email: 'not-stored@example.invalid', query: '?token=private', ip: 'discard' }]), [base]);
  for (const path of ['/destacar', '/como-nos-conociste', '/newsletter/confirmar', '/?q=private', '/o/evento?token=secret', '/o/../../destacar', 'https://evil.example/']) {
    assert.equal(publicAnalyticsPath(path), false);
    assert.equal(listingEvents([{ ...base, path }]), null);
  }
});
test('placement describes the slot, not the listing sponsorship flag', () => {
  assert.ok(listingEvents([{ ...base, placement: 'organic', path: '/hackathons-argentina' }]));
  assert.ok(listingEvents([{ ...base, placement: 'related', path: '/o/another-event' }]));
  for (const change of [{ placement: 'featured', path: '/hackathons-ia' }, { placement: 'related', path: '/' }, { placement: 'organic', path: '/o/other' }, { placement: 'paid' }, { position: 0 }, { position: 501 }, { position: 1.5 }, { exposure: null }]) assert.equal(listingEvents([{ ...base, ...change }]), null);
});
test('detail attribution must be an opaque UUID and must match the detail path', () => {
  const detail = { ...base, kind: 'detail_view', placement: 'detail', path: '/o/hackathon-demo', position: null };
  assert.ok(listingEvents([detail])); assert.ok(listingEvents([{ ...detail, exposure: null }]));
  for (const change of [{ path: '/o/other' }, { exposure: 'someone@example.invalid' }, { position: 1 }, { placement: 'featured' }]) assert.equal(listingEvents([{ ...detail, ...change }]), null);
  for (const input of [null, {}, [], Array(21).fill(base), [{ ...base, id: 'invalid' }], [{ ...base, slug: '../destacar' }]]) assert.equal(listingEvents(input), null);
});
test('local and preview traffic cannot write even with flags or production credentials', () => {
  const flags = { LISTING_ANALYTICS_ENABLED: '1', NEXT_PUBLIC_LISTING_ANALYTICS_ENABLED: '1' };
  assert.equal(analyticsEnabled(flags), false);
  assert.equal(analyticsEnabled({ ...flags, VERCEL_ENV: 'preview' }), false);
  assert.equal(analyticsEnabled({ ...flags, VERCEL_ENV: 'production' }), true);
  assert.equal(analyticsEnabled({ ...flags, VERCEL_ENV: 'production', LISTING_ANALYTICS_ENABLED: '0' }), false);
  for (const ua of ['', 'Googlebot', 'Mozilla HeadlessChrome', 'curl/8.0', 'WhatsApp preview']) assert.equal(analyticsBot(ua), true);
  assert.equal(analyticsBot('Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36'), false);
});
