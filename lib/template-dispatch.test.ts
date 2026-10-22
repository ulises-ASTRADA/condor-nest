import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchTemplate } from './template-dispatch';

test('invalid or consumed dispatch cannot send', async () => {
  const result = await dispatchTemplate('hash', { rpc: async () => null, send: async () => { throw new Error('must not send'); } });
  assert.equal(result, 'invalid');
});
test('sends only the private job and uses a stable idempotency key', async () => {
  const calls: unknown[] = [];
  const result = await dispatchTemplate('hash', {
    rpc: async (name, args) => { calls.push([name, args]); return name === 'cn_claim_template_mail' ? { id: 'job-id', email: 'recipient@example.com', template_id: 'approved-template' } : null; },
    send: async (payload, key) => { assert.deepEqual(payload, { to: ['recipient@example.com'], template: { id: 'approved-template' } }); assert.equal(key, 'template-mail-job-id'); return { ok: true }; },
  });
  assert.equal(result, 'sent');
  assert.deepEqual(calls[1], ['cn_template_mail_delivery', { dispatch_id: 'job-id', delivery_error: null }]);
});
test('failed send is recorded rather than reported as sent', async () => {
  const calls: unknown[] = [];
  const result = await dispatchTemplate('hash', {
    rpc: async (name, args) => { calls.push([name, args]); return name === 'cn_claim_template_mail' ? { id: 'job-id', email: 'recipient@example.com', template_id: 'approved-template' } : null; },
    send: async () => ({ ok: false, reason: 'network' }),
  });
  assert.equal(result, 'failed');
  assert.deepEqual(calls[1], ['cn_template_mail_delivery', { dispatch_id: 'job-id', delivery_error: 'network' }]);
});
