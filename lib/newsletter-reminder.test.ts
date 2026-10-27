import test from 'node:test';
import assert from 'node:assert/strict';
import { reminderEmail, REMINDER_RAFFLE_LINE, REMINDER_SUBJECT } from './newsletter-reminder';

const URL_OK = 'https://condor-nest.lat/newsletter/confirmar?token=' + 'a'.repeat(64);

test('reminder uses the approved copy, the confirm link and the shared light layout', () => {
  const m = reminderEmail(URL_OK);
  assert.equal(m.subject, '¡Te falta un clic para entrar al nido!');
  assert.ok(m.html.includes('<h1 style="margin:8px 0 8px;font-size:22px;line-height:28px;font-weight:700;color:#18181b">¡Te falta un clic para entrar al nido!</h1>'));
  assert.ok(m.text.startsWith('¡Te falta un clic para entrar al nido!'));
  assert.ok(!m.html.includes('casualidad'));
  assert.equal(REMINDER_SUBJECT, m.subject);
  for (const s of ['quedó sin confirmar', 'cuándo cierran en tu hora', 'Confirmar suscripción', 'El link vence en 48 horas', 'Hecho en Córdoba. Para builders de toda LatAm.', 'CONDOR NEST', '#c6ff3d', 'max-width:480px']) {
    assert.ok(m.html.includes(s), `html missing: ${s}`);
  }
  assert.ok(m.html.includes(`href="${URL_OK}"`));
  assert.ok(m.text.includes(URL_OK) && m.text.includes(REMINDER_RAFFLE_LINE));
  assert.ok(m.html.includes(REMINDER_RAFFLE_LINE));
});

test('raffle line is a single swappable constant', () => {
  const alt = 'Y te enterás antes que nadie de los sorteos que estamos armando.';
  const m = reminderEmail(URL_OK, alt);
  assert.ok(m.html.includes(alt) && m.text.includes(alt));
  assert.ok(!m.html.includes(REMINDER_RAFFLE_LINE));
});

test('no Monday promise, no personal names, no unsubscribe link in the body', () => {
  const { html, text } = reminderEmail(URL_OK);
  for (const s of [html, text]) {
    assert.doesNotMatch(s, /lunes/i);
    assert.doesNotMatch(s, /ulises|belo/i);
    assert.doesNotMatch(s, /unsubscribe|newsletter\/baja/);
  }
});

test('only https links to /newsletter/confirmar are accepted, and they are escaped', () => {
  assert.throws(() => reminderEmail('http://condor-nest.lat/newsletter/confirmar?token=x'));
  assert.throws(() => reminderEmail('https://condor-nest.lat/otra?token=x'));
  const m = reminderEmail('https://condor-nest.lat/newsletter/confirmar?token=a&x="1"');
  assert.ok(m.html.includes('token=a&amp;x=&quot;1&quot;'));
});

test('reminder sender display name is always Condor Nest', async () => {
  const { reminderFrom } = await import('./newsletter-reminder');
  assert.equal(reminderFrom('Condor Nest <hola@condor-nest.lat>'), 'Condor Nest <hola@condor-nest.lat>');
  assert.equal(reminderFrom('hola@condor-nest.lat'), 'Condor Nest <hola@condor-nest.lat>');
  assert.equal(reminderFrom('Otro <onboarding@resend.dev>'), 'Condor Nest <onboarding@resend.dev>');
  assert.throws(() => reminderFrom('nada'));
});
