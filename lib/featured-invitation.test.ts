import test from 'node:test';
import assert from 'node:assert/strict';
import { featuredPrefill, featuredInvitationNotice, type FeaturedSubmission } from './featured-invitation';

const submission: FeaturedSubmission = {
  name:'Persona de contacto',email:'organizador@example.invalid',event_name:'Evento original',kind:'hackathon',
  location:'Córdoba, Argentina',dates:'7 al 9 de noviembre, cierre de registro el 5',prize:'USD 500',
  url:'https://example.org/evento',notes:'Solo estudiantes. <script>prueba</script>',
};
test('prefill reuses shared fields without guessing dates, organization or eligibility from free text', () => {
  const event = featuredPrefill(submission);
  assert.equal(event.title,submission.event_name);
  assert.equal(event.email,submission.email);
  assert.equal(event.prize,submission.prize);
  assert.equal(event.registrationUrl,submission.url);
  assert.equal(event.location,submission.location);
  assert.equal(event.organizer,'');
  assert.equal(event.startsOn,undefined);
  assert.equal(event.endsOn,undefined);
  assert.equal(event.eligibility,undefined);
  assert.equal(event.summary,undefined);
});
test('only explicit virtual locations set modality and missing prizes remain empty', () => {
  for (const location of ['Online',' virtual ','REMOTO']) {
    const event=featuredPrefill({ ...submission,location,prize:null });
    assert.equal(event.modality,'virtual'); assert.equal(event.location,''); assert.equal(event.prize,'');
  }
  assert.equal(featuredPrefill({ ...submission,location:'Ciudad con sede virtual por confirmar' }).modality,undefined);
});
test('internal notice includes the private link and five-day expiry, escaping HTML', () => {
  const url=`https://condor-nest.lat/destacar?solicitud=${'a'.repeat(64)}&test="<x>`;
  const notice=featuredInvitationNotice({ url,expiresAt:'2026-10-27T15:00:00Z' });
  assert.match(notice.text,/5 días desde su creación/);
  assert.match(notice.text,/27\/10\/26/);
  assert.match(notice.text,/12:00/);
  assert.ok(notice.text.includes(url));
  assert.ok(notice.html.includes('&amp;test=&quot;&lt;x&gt;'));
  assert.ok(!notice.html.includes('<x>'));
  assert.ok(!notice.html.includes(submission.email));
});
