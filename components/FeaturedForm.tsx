'use client';

import { useRef, useState } from 'react';
import { FEATURED_PLANS, featuredEndDate, featuredMoney, featuredQuote, type FeaturedEvent, type FeaturedPlanId } from '@/lib/featured-pricing';
import { mapLocation } from '@/lib/map-location';

const card = 'rounded-card border border-border bg-surface p-5 sm:p-6';
const input = 'fx-input mt-2 h-12 w-full min-w-0 rounded-[12px] border border-border bg-bg px-3.5 text-base text-fg placeholder:text-fg-muted';
const textArea = `${input} h-auto resize-y py-3`;
const button = 'min-h-12 rounded-pill border border-border px-5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime disabled:opacity-50';
function Required() { return <><span aria-hidden="true" className="text-danger"> *</span><span className="sr-only"> (obligatorio)</span></>; }
function readableDate(value: string) { return value ? value.split('-').reverse().join('/') : 'A elegir'; }

export function FeaturedForm({ event: selectedEvent }: { event: FeaturedEvent }) {
  const [planId, setPlanId] = useState<FeaturedPlanId>('fortnight');
  const [start, setStart] = useState('');
  const [title, setTitle] = useState(selectedEvent.title);
  const [summary, setSummary] = useState(selectedEvent.summary ?? '');
  const [eligibility, setEligibility] = useState(selectedEvent.eligibility ?? '');
  const [organizerName, setOrganizerName] = useState(selectedEvent.organizer);
  const [contactEmail, setContactEmail] = useState(selectedEvent.email);
  const [contactPhone, setContactPhone] = useState(selectedEvent.phone ?? '');
  const [organizerAbout, setOrganizerAbout] = useState(selectedEvent.organizerAbout ?? '');
  const [registrationUrl, setRegistrationUrl] = useState(selectedEvent.registrationUrl ?? '');
  const [modality, setModality] = useState<NonNullable<FeaturedEvent['modality']>>(selectedEvent.modality ?? 'presencial');
  const [location, setLocation] = useState(selectedEvent.location ?? '');
  const [prize, setPrize] = useState(selectedEvent.prize ?? '');
  const [eventStart, setEventStart] = useState(selectedEvent.startsOn ?? '');
  const [eventEnd, setEventEnd] = useState(selectedEvent.endsOn ?? '');
  const [coupon, setCoupon] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [details, setDetails] = useState<{ notes: string } | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [formError, setFormError] = useState('');
  const result = useRef<HTMLElement>(null);
  const quote = featuredQuote(planId, appliedCode ? 30 : 0);
  const end = featuredEndDate(start, quote.days);
  const venueMap = modality === 'virtual' ? null : mapLocation(location);
  const today = new Date();
  const minStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  function applyCoupon() {
    if (coupon.trim().toUpperCase() !== 'PRUEBA30') {
      setAppliedCode('');
      setCouponError('Para esta vista de prueba usá PRUEBA30. Los códigos reales se validarán al habilitar el formulario.');
      return;
    }
    setAppliedCode('PRUEBA30'); setCouponError('');
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (title.trim().length < 3 || !summary.trim() || !eligibility.trim() || !organizerName.trim() || !organizerAbout.trim()) { setFormError('Completá los datos obligatorios del evento y del organizador.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contactEmail.trim())) { setFormError('Ingresá un email de contacto válido para tu organización.'); return; }
    if (modality !== 'virtual' && !venueMap) { setFormError('Ingresá una dirección completa o un enlace válido de Google Maps con https://.'); return; }
    try { const url = new URL(registrationUrl.trim()); if (url.protocol !== 'https:' || !url.hostname.includes('.')) throw new Error(); }
    catch { setFormError('El link de inscripción debe ser una dirección válida que empiece con https://.'); return; }
    if (!end || start < minStart) { setFormError('Revisá la fecha de inicio.'); return; }
    if (!prize.trim()) { setFormError('Completá el premio o indicá “Sin premio”.'); return; }
    if (!featuredEndDate(eventStart, 1) || !featuredEndDate(eventEnd, 1) || eventEnd < eventStart) { setFormError('La fecha de finalización del evento debe ser igual o posterior a la de inicio.'); return; }
    if (coupon.trim() && !appliedCode) { setFormError('Aplicá el código o borrá el campo para continuar sin descuento.'); return; }
    setFormError('');
    setDetails({ notes: String(data.get('notes') ?? '').trim() });
    setReviewing(true);
    requestAnimationFrame(() => { result.current?.focus(); result.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
  }

  if (reviewing && details) return <section ref={result} tabIndex={-1} aria-labelledby="featured-review" className={`${card} mx-auto max-w-2xl scroll-mt-24 outline-none`}>
    <p className="font-mono text-xs uppercase tracking-[.12em] text-cyan">Simulación de solicitud</p>
    <h2 id="featured-review" className="mt-3 font-display text-2xl font-semibold">Así quedaría tu destacado.</h2>
    <p role="status" className="mt-3 text-fg-muted">Esta prueba no se envió, no reservó un lugar y no utilizó ningún código real.</p>
    <dl className="mt-6 space-y-4 break-words text-sm">
      {[
        ['Nombre del evento', title.trim()], ['En pocas palabras', summary.trim()],
        ['Modalidad', modality === 'virtual' ? 'Virtual' : modality === 'hibrido' ? 'Híbrido' : 'Presencial'],
        ...(modality !== 'virtual' ? [['Ubicación', location.trim()]] : []),
        ['Elegibilidad', eligibility.trim()], ['Organizador', organizerName.trim()], ['Sobre el organizador', organizerAbout.trim()],
        ['Link de inscripción', registrationUrl.trim()],
        ['Email de contacto', contactEmail.trim()],
        ...(contactPhone.trim() ? [['Teléfono de contacto', contactPhone.trim()]] : []),
        ['Premio', prize.trim()],
        ['Inicio del evento', readableDate(eventStart)], ['Finalización del evento', readableDate(eventEnd)],
        ['Duración del destacado', `${quote.days} días · ${readableDate(start)} al ${readableDate(end)}`],
        ['Precio', featuredMoney(quote.subtotalCents)],
        ...(appliedCode ? [['Descuento PRUEBA30 (30%)', `−${featuredMoney(quote.discountCents)}`]] : []),
        ['Total propuesto', featuredMoney(quote.totalCents)],
        ...(details.notes ? [['Notas', details.notes]] : []),
      ].map(([label, value]) => <div key={label}><dt className="text-fg-muted">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{value}</dd></div>)}
    </dl>
    {venueMap && <div className="mt-6 space-y-3">
      {venueMap.embedUrl && <div className="overflow-hidden rounded-[12px] border border-border"><iframe title="Mapa de la ubicación del evento" src={venueMap.embedUrl} className="h-64 w-full border-0" loading="lazy" referrerPolicy="no-referrer" /></div>}
      <a href={venueMap.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm text-lime underline underline-offset-4">Abrir ubicación en Google Maps ↗</a>
    </div>}
    <button type="button" onClick={() => setReviewing(false)} className={`${button} mt-6 border-lime/50 text-lime`}>Volver al formulario</button>
  </section>;

  return <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    <div className="min-w-0 space-y-5">
      <p className="text-xs text-fg-muted"><span aria-hidden="true" className="text-danger">*</span> Campos obligatorios</p>
      <section className={`${card} border-lime/25`} aria-labelledby="featured-event">
        <p className="font-mono text-xs uppercase tracking-[.12em] text-lime">Tu evento</p>
        <h2 id="featured-event" className="mt-3 text-xl font-medium">{title.trim() || 'Tu evento'}</h2>
        <p className="mt-2 break-words text-sm text-fg-muted">{organizerName.trim() || 'Tu organización'}{contactEmail.trim() ? ` · ${contactEmail.trim()}` : ''}</p>
        <p className="mt-3 text-xs text-fg-muted">Completá los datos de tu evento para ver cómo quedaría el destacado.</p>
      </section>
      <section className={card} aria-labelledby="featured-event-details">
        <h2 id="featured-event-details" className="text-xl font-medium">01. Datos del evento</h2>
        <label htmlFor="featured-title" className="mt-5 block text-sm">Nombre del evento<Required /></label>
        <input id="featured-title" name="title" required minLength={3} maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tu evento" className={input} />
        <label htmlFor="featured-description" className="mt-5 block text-sm">En pocas palabras<Required /></label>
        <textarea id="featured-description" name="summary" required maxLength={300} rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Contanos de qué se trata y qué van a construir o aprender quienes participen." className={textArea} />
        <label htmlFor="featured-prize" className="mt-5 block text-sm">Premio<Required /></label>
        <input id="featured-prize" name="prize" required maxLength={160} value={prize} onChange={(event) => setPrize(event.target.value)} placeholder="Por ejemplo: USD 5.000 en premios" aria-describedby="featured-prize-hint" className={input} />
        <p id="featured-prize-hint" className="mt-2 text-xs text-fg-muted">Si no hay premio, indicá “Sin premio”.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="featured-event-start" className="block text-sm">Fecha de inicio del evento<Required /></label><input id="featured-event-start" name="eventStart" type="date" required value={eventStart} onChange={(event) => setEventStart(event.target.value)} className={input} /></div>
          <div><label htmlFor="featured-event-end" className="block text-sm">Fecha de finalización del evento<Required /></label><input id="featured-event-end" name="eventEnd" type="date" required min={eventStart || undefined} value={eventEnd} onChange={(event) => setEventEnd(event.target.value)} className={input} /></div>
        </div>
        <label htmlFor="featured-modality" className="mt-5 block text-sm">Modalidad<Required /></label>
        <div className="relative mt-2">
          <select id="featured-modality" name="modality" required value={modality} onChange={(event) => setModality(event.target.value as NonNullable<FeaturedEvent['modality']>)} className={`${input} mt-0 appearance-none pr-12`}><option value="presencial">Presencial</option><option value="virtual">Virtual</option><option value="hibrido">Híbrido</option></select>
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"><path d="m6 9 6 6 6-6" /></svg>
        </div>
        <label htmlFor="featured-location" className="mt-5 block text-sm">Ubicación{modality !== 'virtual' && <Required />}</label>
        <input id="featured-location" name="location" required={modality !== 'virtual'} disabled={modality === 'virtual'} maxLength={2048} value={modality === 'virtual' ? '' : location} onChange={(event) => setLocation(event.target.value)} aria-describedby="featured-location-hint" placeholder={modality === 'virtual' ? 'No aplica para eventos virtuales' : 'Dirección completa o link de Google Maps'} className={`${input} disabled:cursor-not-allowed disabled:opacity-50`} />
        <p id="featured-location-hint" className="mt-2 text-xs text-fg-muted">{modality === 'virtual' ? 'Los eventos virtuales no muestran un mapa.' : 'Podés escribir la dirección, ciudad y país o pegar el enlace de Google Maps. También aceptamos enlaces cortos de Maps.'}</p>
        <label htmlFor="featured-eligibility" className="mt-5 block text-sm">Elegibilidad<Required /></label>
        <textarea id="featured-eligibility" name="eligibility" required maxLength={1000} rows={3} value={eligibility} onChange={(event) => setEligibility(event.target.value)} placeholder="¿Quiénes pueden participar? Indicá niveles, edades, países o requisitos, si los hay." className={textArea} />
        <label htmlFor="featured-registration" className="mt-5 block text-sm">Link de inscripción<Required /></label>
        <input id="featured-registration" name="registrationUrl" type="url" required maxLength={500} value={registrationUrl} onChange={(event) => setRegistrationUrl(event.target.value)} placeholder="https://…" className={input} />
      </section>
      <section className={card} aria-labelledby="featured-organizer">
        <h2 id="featured-organizer" className="text-xl font-medium">02. Sobre el organizador</h2>
        <label htmlFor="featured-organizer-name" className="mt-5 block text-sm">Nombre de la organización<Required /></label>
        <input id="featured-organizer-name" name="organizerName" required maxLength={200} value={organizerName} onChange={(event) => setOrganizerName(event.target.value)} placeholder="Tu organización" className={input} />
        <label htmlFor="featured-organizer-about" className="mt-5 block text-sm">Sobre el organizador<Required /></label>
        <textarea id="featured-organizer-about" name="organizerAbout" required maxLength={1000} rows={4} value={organizerAbout} onChange={(event) => setOrganizerAbout(event.target.value)} placeholder="Contanos quién organiza el evento y a qué se dedica." className={textArea} />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="featured-contact-email" className="block text-sm">Email de contacto<Required /></label>
            <input id="featured-contact-email" name="contactEmail" type="email" required maxLength={254} autoComplete="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="contacto@tuorganizacion.com" className={input} />
          </div>
          <div>
            <label htmlFor="featured-contact-phone" className="block text-sm">Teléfono de contacto <span className="text-xs text-fg-muted">Opcional</span></label>
            <input id="featured-contact-phone" name="contactPhone" type="tel" inputMode="tel" maxLength={40} autoComplete="tel" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="Incluí el código de país" className={input} />
          </div>
        </div>
        <p className="mt-2 text-xs text-fg-muted">Datos para contactar a tu organización por el destacado.</p>
      </section>
      <fieldset className={card}>
        <legend className="sr-only">Duración del destacado (obligatorio)</legend>
        <h2 aria-hidden="true" className="text-xl font-medium">03. Duración del destacado<Required /></h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {FEATURED_PLANS.map((plan) => <label key={plan.id} className="relative flex cursor-pointer flex-col rounded-[14px] border border-border bg-bg p-4 transition-colors has-[:checked]:border-lime has-[:checked]:bg-lime/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-lime">
            <input type="radio" name="plan" value={plan.id} required checked={planId === plan.id} onChange={() => setPlanId(plan.id)} className="mb-4 h-4 w-4 accent-[rgb(var(--lime))]" />
            <span className="text-lg font-medium">{plan.days} días</span>
            <span className="mt-2 font-mono text-xl text-lime">{featuredMoney(plan.priceCents)}</span>
            <span className="mt-3 text-xs leading-relaxed text-fg-muted">{plan.description}</span>
          </label>)}
        </div>
        <label htmlFor="featured-start" className="mt-5 block text-sm">Fecha de inicio del destacado<Required /></label>
        <input id="featured-start" name="start" type="date" required min={minStart} value={start} onChange={(event) => setStart(event.target.value)} className={input} />
        <p aria-live="polite" className="mt-2 text-xs text-fg-muted">{end ? `Tu campaña iría del ${readableDate(start)} al ${readableDate(end)}, inclusive.` : 'Elegí una fecha. La activación está sujeta a revisión y disponibilidad.'}</p>
      </fieldset>

      <section className={card} aria-labelledby="featured-contact">
        <h2 id="featured-contact" className="text-xl font-medium">04. ¿Querés agregar algo?</h2>
        <label htmlFor="featured-notes" className="mt-4 block text-sm">¿Algo más que debamos saber? <span className="text-xs text-fg-muted">Opcional</span><textarea id="featured-notes" name="notes" rows={3} maxLength={1000} defaultValue={details?.notes} placeholder="Por ejemplo, una fecha límite de inscripción." className={`${input} h-auto resize-y py-3`} /></label>
      </section>

      <section className={card} aria-labelledby="featured-benefits">
        <h2 id="featured-benefits" className="text-lg font-medium">¿Qué incluye?</h2>
        <ul className="mt-4 space-y-3 text-sm text-fg-muted"><li>✦ Presencia en el espacio Destacado del feed durante los días elegidos.</li><li>✦ Etiqueta Destacado visible en tu publicación.</li><li>✦ Enlace hacia tu evento para que puedan conocerlo e inscribirse.</li></ul>
        <p className="mt-4 text-xs leading-relaxed text-fg-muted">Se mantienen los filtros y criterios de publicación de Condor Nest. La ubicación se comparte con otros destacados; no se garantizan clics ni inscripciones.</p>
      </section>
    </div>

    <aside className={`${card} min-w-0 lg:sticky lg:top-24`} aria-labelledby="featured-summary">
      <p className="font-mono text-xs uppercase tracking-[.12em] text-magenta">Tu campaña</p>
      <h2 id="featured-summary" className="mt-3 text-xl font-medium">Destacado · {quote.days} días</h2>
      <p className="mt-2 text-sm text-fg-muted">{start ? `${readableDate(start)} → ${readableDate(end)}` : 'Elegí la fecha de inicio'}</p>
      <div className="mt-6 border-y border-border py-5">
        <label htmlFor="featured-coupon" className="text-sm">¿Tenés un código de descuento?</label>
        <input id="featured-coupon" value={coupon} onChange={(event) => { setCoupon(event.target.value); setAppliedCode(''); setCouponError(''); }} maxLength={40} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="Ingresá tu código" aria-invalid={!!couponError} aria-describedby="featured-coupon-message" className={`${input} font-mono`} />
        <button type="button" disabled={!coupon.trim()} onClick={applyCoupon} className={`${button} mt-3 w-full`}>{appliedCode ? 'Código aplicado ✓' : 'Aplicar código'}</button>
        <p id="featured-coupon-message" role={couponError ? 'alert' : 'status'} className={`mt-2 text-xs ${couponError ? 'text-danger' : appliedCode ? 'text-lime' : 'text-fg-muted'}`}>{couponError || (appliedCode ? '30% de descuento aplicado.' : 'Para probar el descuento, usá PRUEBA30.')}</p>
      </div>
      <dl aria-live="polite" aria-atomic="true" className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-fg-muted">Precio</dt><dd>{featuredMoney(quote.subtotalCents)}</dd></div>
        {appliedCode && <div className="flex justify-between gap-3 text-lime"><dt>Descuento (30%)</dt><dd>−{featuredMoney(quote.discountCents)}</dd></div>}
        <div className="flex justify-between gap-3 border-t border-border pt-4 text-lg font-medium"><dt>Total</dt><dd>{featuredMoney(quote.totalCents)}</dd></div>
      </dl>
      <p className="mt-2 text-xs text-fg-muted">Precio propuesto en dólares estadounidenses. Un solo pago, sin renovación automática.</p>
      {formError && <p role="alert" className="mt-4 text-sm text-danger">{formError}</p>}
      <button type="submit" className="mt-6 min-h-12 w-full rounded-pill bg-lime px-5 py-3 font-medium text-primary-fg hover:shadow-glow-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">Revisar solicitud <span aria-hidden="true">↗</span></button>
      <p className="mt-3 text-center text-xs leading-relaxed text-fg-muted">Vista de prueba. No se realiza ningún pago ni se envía la solicitud.</p>
    </aside>
  </form>;
}
