import test from 'node:test';
import assert from 'node:assert/strict';
import { featuredEndDate, featuredQuote } from './featured-pricing';

test('featured prices apply 30 percent in cents across all durations', () => {
  for (const [id, subtotal, total] of [['week', 1900, 1330], ['fortnight', 2900, 2030], ['month', 4900, 3430]] as const) {
    const quote = featuredQuote(id, 30);
    assert.equal(quote.totalCents, total);
    assert.equal(quote.discountCents + quote.totalCents, subtotal);
    assert.equal(featuredQuote(id).totalCents, subtotal);
  }
});
test('featured quotes reject unknown plans and invalid percentages', () => {
  assert.throws(() => featuredQuote('unknown', 30));
  for (const percent of [-1, 101, 0.5, NaN, Infinity]) assert.throws(() => featuredQuote('week', percent));
});
test('campaign dates are inclusive and handle month/year boundaries', () => {
  assert.equal(featuredEndDate('2026-10-22', 7), '2026-10-28');
  assert.equal(featuredEndDate('2026-12-25', 14), '2027-01-07');
  assert.equal(featuredEndDate('2028-02-28', 7), '2028-03-05');
  assert.equal(featuredEndDate('2026-02-30', 7), '');
  assert.equal(featuredEndDate('', 7), '');
});
