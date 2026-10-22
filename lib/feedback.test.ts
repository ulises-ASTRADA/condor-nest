import test from 'node:test';
import assert from 'node:assert/strict';
import { feedbackAnswers } from './feedback';

const valid = { source: 'LinkedIn', purpose: 'Publicar o difundir un evento', rating: 'Neutral', useful: '  Los filtros  ', improve: '' };
test('survey validates the five answers and normalizes optional text', () => {
  assert.deepEqual(feedbackAnswers(valid), { source: 'LinkedIn', source_other: null, purpose: valid.purpose, rating: 3, useful: 'Los filtros', improve: null });
});
test('other discovery source requires a short explanation and ignores stale hidden text', () => {
  assert.equal(feedbackAnswers({ ...valid, source: 'Otro lugar' }), null);
  assert.equal(feedbackAnswers({ ...valid, source: 'Otro lugar', sourceOther: '  ' }), null);
  assert.equal(feedbackAnswers({ ...valid, source: 'Otro lugar', sourceOther: 'a'.repeat(201) }), null);
  assert.equal(feedbackAnswers({ ...valid, source: 'Otro lugar', sourceOther: '  Un podcast  ' })?.source_other, 'Un podcast');
  assert.equal(feedbackAnswers({ ...valid, sourceOther: 'Un podcast' })?.source_other, null);
});
test('survey rejects missing, unknown or oversized answers', () => {
  for (const input of [null, [], {}, { ...valid, rating: '6' }, { ...valid, source: 'injected' }, { ...valid, purpose: '' }, { ...valid, useful: 7 }, { ...valid, improve: 'x'.repeat(1001) }]) assert.equal(feedbackAnswers(input), null);
});
