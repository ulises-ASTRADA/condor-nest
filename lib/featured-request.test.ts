import test from 'node:test';
import assert from 'node:assert/strict';
import { featuredRequest } from './featured-request';
import { featuredEmail, type SavedFeaturedRequest } from './featured-email';

const input = { title:'Evento de prueba',summary:'Construimos juntos',prize:'Sin premio',eventStart:'2026-11-01',eventEnd:'2026-11-02',modality:'virtual',location:'stale physical address',eligibility:'Abierto',registrationUrl:'https://example.com/registro',organizerName:'Organización',organizerAbout:'Comunidad de builders',contactEmail:'  PRUEBA@EXAMPLE.COM ',contactPhone:'',notes:'',planId:'fortnight',start:'2026-10-23',coupon:'' };
test('featured submissions normalize contact details, ignore virtual addresses and disregard client prices', () => {
  const f = featuredRequest({ ...input,totalCents:1,discountPercent:100 },'2026-10-22')!;
  assert.equal(f.contactEmail,'prueba@example.com');
  assert.equal(f.location,'');
  assert.equal('totalCents' in f,false);
  assert.equal('discountPercent' in f,false);
  assert.equal(f.contactPhone,'');
});
test('featured submissions enforce contact, dates, content limits and real coupon formats', () => {
  for (const changes of [
    { contactEmail:'bad' },{ eventEnd:'2026-10-31' },{ eventStart:'2026-02-30' },{ start:'2026-10-21' },
    { planId:'invented' },{ coupon:'PRUEBA30' },{ summary:' ' },{ organizerAbout:'x'.repeat(1001) },
    { registrationUrl:'javascript:alert(1)' },{ registrationUrl:'http://example.com' },{ modality:'presencial',location:'' },
  ]) assert.equal(featuredRequest({ ...input,...changes },'2026-10-22'),null);
  assert.equal(featuredRequest({ ...input,coupon:' nido30-abcdef123456 ' },'2026-10-22')?.coupon,'NIDO30-ABCDEF123456');
});
test('featured confirmation escapes input, includes frozen totals and never implies payment', () => {
  const saved:SavedFeaturedRequest = { id:'test-id',details:{ ...featuredRequest(input,'2026-10-22')!,title:'<script>bad()</script>' },days:14,starts_on:'2026-10-23',ends_on:'2026-11-05',subtotal_cents:2900,discount_percent:30,discount_cents:870,total_cents:2030,owner_mail_status:'pending',contact_mail_status:'pending',expires_at:'2026-10-24T19:00:00Z' };
  for (const target of ['owner','contact'] as const) {
    const mail = featuredEmail(saved,target);
    assert.ok(mail.html.includes('&lt;script&gt;'));
    assert.ok(!mail.html.includes('<script>'));
    assert.match(mail.text,/USD 20,30/);
    assert.match(mail.text,/no se realizó ningún cobro/);
    assert.match(mail.text,/48 horas/);
  }
});
