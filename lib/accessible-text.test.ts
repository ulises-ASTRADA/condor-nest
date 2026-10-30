import test from 'node:test';
import assert from 'node:assert/strict';
import { withoutDecorativeEmoji } from './accessible-text';

test('accessible names omit decorative emoji while preserving the title text', () => {
  assert.equal(withoutDecorativeEmoji('Create Content on worm 🪱⚽'), 'Create Content on worm');
  assert.equal(withoutDecorativeEmoji('Hackathon 🇦🇷'), 'Hackathon');
});
