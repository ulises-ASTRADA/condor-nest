import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmWithWelcome } from './newsletter-confirm';
import { welcomeEmail } from './welcome-email';

test('welcome is sent only when the confirmation transaction emits a job', async () => {
  const calls: unknown[] = [];
  const deps = {
    rpc: async (name: string, args: unknown) => {
      calls.push({ name, args });
      return name === 'cn_confirm_with_welcome' ? { status: 'confirmed', welcome: { id: 'job-1', email: 'subscriber@example.com' } } : null;
    },
    send: async (payload: Record<string, unknown>, key: string) => {
      assert.equal(key, 'newsletter-welcome-job-1');
      assert.deepEqual(payload.to, ['subscriber@example.com']);
      assert.match(String(payload.html), /newsletter\/baja\?token=unsubscribe/);
      assert.match(JSON.stringify(payload.headers), /List-Unsubscribe=One-Click/);
      return { ok: true as const };
    },
  };
  assert.equal(await confirmWithWelcome('hash', 'unsubscribe', 'unsubscribe-hash', 'https://condor-nest.lat', deps), 'confirmado');
  assert.deepEqual(calls.at(-1), { name: 'cn_welcome_delivery', args: { welcome_id: 'job-1', delivery_error: null } });
  for (const status of ['invalid', 'expired']) {
    assert.equal(await confirmWithWelcome('hash', 'unsubscribe', 'unsubscribe-hash', 'https://condor-nest.lat', {
      rpc: async () => ({ status }), send: async () => { throw new Error('Must not send'); },
    }), 'invalido');
  }
});

test('a mail failure remains recorded without undoing confirmation', async () => {
  let lastArgs: unknown;
  assert.equal(await confirmWithWelcome('hash', 'unsubscribe', 'unsubscribe-hash', 'https://condor-nest.lat', {
    rpc: async (name, args) => { lastArgs = args; return name === 'cn_confirm_with_welcome' ? { status: 'confirmed', welcome: { id: 'job-2', email: 'subscriber@example.com' } } : null; },
    send: async () => ({ ok: false, reason: 'network' }),
  }), 'confirmado');
  assert.deepEqual(lastArgs, { welcome_id: 'job-2', delivery_error: 'network' });
});

test('welcome links stay on the HTTPS site and have HTML and text versions', () => {
  const email = welcomeEmail('https://condor-nest.lat', 'https://condor-nest.lat/newsletter/baja?token=abc&other=123');
  assert.match(email.html, /token=abc&amp;other=123/);
  assert.match(email.text, /Equipo de Condor Nest/);
  assert.doesNotMatch(email.html, /El lunes/);
  assert.throws(() => welcomeEmail('https://condor-nest.lat', 'https://other.example/'));
});
