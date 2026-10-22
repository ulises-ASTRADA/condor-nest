'use client';

import { useRef, useState } from 'react';
import { FEEDBACK_SOURCES as sources, FEEDBACK_PURPOSES as purposes, FEEDBACK_RATINGS as ratings, type FeedbackStatus } from '@/lib/feedback';

const questionClass = 'rounded-card border border-border bg-surface p-5 sm:p-6';
const textAreaClass = 'fx-input mt-4 min-h-28 w-full resize-y rounded-[12px] border border-border bg-bg px-4 py-3 text-base text-fg placeholder:text-fg-muted';

function QuestionTitle({ number, children, optional = false }: { number: number; children: React.ReactNode; optional?: boolean }) {
  return <><span className="mb-2 block font-mono text-xs uppercase tracking-[.1em] text-lime">Pregunta {number.toString().padStart(2, '0')}</span><span className="text-lg font-medium">{children}{!optional && <span aria-hidden="true" className="text-danger"> *</span>}</span>{optional && <span className="ml-2 text-xs font-normal text-fg-muted">Opcional</span>}</>;
}

export function DiscoveryForm({ token, demo = false, initialCoupon }: { token?: string; demo?: boolean; initialCoupon?: string }) {
  const [source, setSource] = useState('');
  const [sourceOther, setSourceOther] = useState('');
  const [purpose, setPurpose] = useState('');
  const [rating, setRating] = useState('');
  const [useful, setUseful] = useState('');
  const [improve, setImprove] = useState('');
  const [submitted, setSubmitted] = useState(!!initialCoupon);
  const [coupon, setCoupon] = useState(initialCoupon);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [couponNotice, setCouponNotice] = useState('');
  const [downloading, setDownloading] = useState(false);
  const resultRef = useRef<HTMLElement>(null);
  const answered = [source, purpose, rating, useful.trim(), improve.trim()].filter(Boolean).length;

  async function copyCoupon() {
    if (!coupon) return;
    try {
      await navigator.clipboard.writeText(coupon);
      setCouponNotice('Código copiado');
    } catch { setCouponNotice('No pudimos copiarlo. Podés seleccionar el código y copiarlo manualmente.'); }
  }

  async function downloadReceipt() {
    if (downloading || !token) return;
    setDownloading(true);
    setCouponNotice('');
    try {
      const response = await fetch('/api/feedback/recibo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }), cache: 'no-store' });
      if (!response.ok) throw new Error('Unavailable');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'condor-nest-descuento.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setCouponNotice('Comprobante descargado');
    } catch { setCouponNotice('No pudimos descargar el comprobante. Probá de nuevo en unos minutos.'); }
    finally { setDownloading(false); }
  }

  function reset() {
    setSource(''); setPurpose(''); setRating(''); setUseful(''); setImprove(''); setSubmitted(false);
    setSourceOther('');
    setError('');
    window.scrollTo({ top: 0 });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setError(''); setSending(true);
    try {
      if (!demo) {
        const response = await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, source, sourceOther, purpose, rating, useful, improve }), cache: 'no-store' });
        const result = await response.json() as FeedbackStatus;
        if (!response.ok || result.status !== 'completed' || !result.discount_code) {
          setError(response.status === 410 ? 'Este enlace ya no está disponible. Pedinos una nueva invitación.' : response.status === 429 ? 'Esperá unos minutos antes de volver a intentar.' : 'No pudimos guardar tus respuestas. Probá de nuevo; no hace falta completarlas otra vez.');
          return;
        }
        setCoupon(result.discount_code);
      }
      setSubmitted(true);
      requestAnimationFrame(() => { resultRef.current?.focus({ preventScroll: true }); resultRef.current?.scrollIntoView({ block: 'start' }); });
    } catch { setError('No pudimos conectarnos. Revisá tu conexión y probá de nuevo.'); }
    finally { setSending(false); }
  }

  if (submitted) return (
    <section ref={resultRef} tabIndex={-1} aria-labelledby="feedback-thanks" className="scroll-mt-24 rounded-card border border-lime/40 bg-surface p-6 outline-none sm:p-8">
      <div aria-hidden="true" className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-lime text-2xl text-primary-fg">✓</div>
      <p className="font-mono text-xs uppercase tracking-[.12em] text-lime">Encuesta completada</p>
      <h2 id="feedback-thanks" className="mt-3 font-display text-2xl font-semibold">Gracias por ayudarnos a mejorar.</h2>
      <p className="mt-3 leading-relaxed text-fg-muted">Cada respuesta nos ayuda a entender qué funciona y dónde podemos hacerlo mejor.</p>
      {demo ? <p role="status" className="mt-5 rounded-[12px] border border-cyan/25 bg-cyan/5 p-3 text-sm text-cyan">Esta es una prueba: tus respuestas no se enviaron ni se guardaron.</p> : <div className="mt-5 rounded-[12px] border border-lime/30 bg-lime/5 p-5">
        <p className="text-lg font-medium">Tenés un 30% de descuento en tu próximo evento destacado.</p>
        <p className="mt-2 text-sm text-fg-muted">Usá este código en el formulario para destacar tu próximo evento. Es de un solo uso.</p>
        <button type="button" onClick={copyCoupon} aria-label={`Copiar código ${coupon}`} className="mt-4 min-h-tap max-w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">
          <span className="break-all font-mono text-xl text-lime">{coupon}</span>
          <span className="mt-1 block text-xs text-fg-muted">Hacé clic para copiar</span>
        </button>
        <div className="mt-4"><button type="button" onClick={downloadReceipt} disabled={downloading || !token} className="min-h-tap rounded-pill border border-lime/60 px-5 py-2 text-sm text-lime hover:shadow-glow-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime disabled:opacity-50">{downloading ? 'Preparando PDF…' : 'Descargar comprobante PDF ↓'}</button></div>
        <p role="status" aria-live="polite" className="mt-2 text-sm text-lime">{couponNotice}</p>
        <p className="mt-3 text-sm text-fg-muted">Tus respuestas quedaron guardadas.</p>
      </div>}
      {source && <details className="mt-6 rounded-[12px] border border-border p-4">
        <summary className="cursor-pointer text-sm text-fg">Ver mis respuestas{demo ? ' de prueba' : ''}</summary>
        <dl className="mt-4 space-y-4 text-sm">
          {[['Cómo nos conociste', source === 'Otro lugar' ? `${source}: ${sourceOther.trim()}` : source], ['Qué te trajo a Condor Nest', purpose], ['Qué tan fácil fue', rating], ['Lo más útil', useful.trim() || 'Sin respuesta'], ['Qué podemos mejorar', improve.trim() || 'Sin respuesta']].map(([label, value]) => <div key={label}><dt className="text-fg-muted">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{value}</dd></div>)}
        </dl>
      </details>}
      {demo && <button type="button" onClick={reset} className="mt-6 min-h-tap rounded-pill border border-lime/60 px-5 text-sm text-lime hover:shadow-glow-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">Probar de nuevo ↺</button>}
    </section>
  );

  return (
    <form onSubmit={submit} className="space-y-4" aria-busy={sending}>
      <p className="text-xs text-fg-muted"><span aria-hidden="true" className="text-danger">*</span> Campos obligatorios</p>
      <div className="mb-6">
        <div className="mb-2 flex justify-between font-mono text-xs text-fg-muted"><span>UN POCO DE VOS, UN MEJOR CONDOR NEST</span><span>{answered}/5</span></div>
        <div role="progressbar" aria-label="Preguntas respondidas" aria-valuemin={0} aria-valuemax={5} aria-valuenow={answered} className="h-1 overflow-hidden rounded-pill bg-surface-2"><div style={{ width: `${answered * 20}%` }} className="h-full rounded-pill bg-lime transition-[width] duration-base" /></div>
      </div>
      <fieldset className={questionClass}>
        <legend className="sr-only">1. ¿Dónde nos conociste?</legend>
        <div aria-hidden="true"><QuestionTitle number={1}>¿Dónde nos conociste?</QuestionTitle></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {sources.map((value) => <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[12px] border border-border bg-bg px-3.5 py-3 text-sm transition-colors has-[:checked]:border-lime has-[:checked]:bg-lime/5 has-[:checked]:text-lime has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-lime"><input type="radio" required name="source" value={value} checked={source === value} onChange={() => setSource(value)} className="h-4 w-4 shrink-0 accent-[rgb(var(--lime))]" />{value}</label>)}
        </div>
        {source === 'Otro lugar' && <div className="mt-3"><label htmlFor="feedback-source-other" className="mb-1.5 block text-sm text-fg-muted">¿Cuál? <span aria-hidden="true" className="text-danger">*</span></label><input id="feedback-source-other" name="sourceOther" required pattern=".*\S.*" maxLength={200} value={sourceOther} onChange={(event) => setSourceOther(event.target.value)} placeholder="¿Cuál?" className="fx-input h-12 w-full min-w-0 rounded-[12px] border border-border bg-bg px-4 text-base text-fg placeholder:text-fg-muted" /></div>}
      </fieldset>
      <fieldset className={questionClass}>
        <legend className="sr-only">2. ¿Qué te trajo a Condor Nest?</legend>
        <div aria-hidden="true"><QuestionTitle number={2}>¿Qué te trajo a Condor Nest?</QuestionTitle></div>
        <div className="mt-4 grid gap-2">
          {purposes.map((value) => <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[12px] border border-border bg-bg px-3.5 py-3 text-sm has-[:checked]:border-lime has-[:checked]:bg-lime/5 has-[:checked]:text-lime has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-lime"><input type="radio" required name="purpose" value={value} checked={purpose === value} onChange={() => setPurpose(value)} className="h-4 w-4 shrink-0 accent-[rgb(var(--lime))]" />{value}</label>)}
        </div>
      </fieldset>
      <fieldset className={questionClass}>
        <legend className="sr-only">3. ¿Qué tan fácil fue encontrar lo que buscabas?</legend>
        <div aria-hidden="true"><QuestionTitle number={3}>¿Qué tan fácil fue encontrar lo que buscabas?</QuestionTitle></div>
        <div className="mt-5 grid grid-cols-5 gap-2">
          {ratings.map((value, index) => <label key={value} className="flex cursor-pointer flex-col items-center gap-2 text-center"><span className="relative grid h-12 w-full place-items-center rounded-[12px] border border-border bg-bg font-mono text-lg has-[:checked]:border-lime has-[:checked]:bg-lime has-[:checked]:text-primary-fg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyan"><input type="radio" required name="rating" aria-label={`${index + 1}: ${value}`} value={value} checked={rating === value} onChange={() => setRating(value)} className="sr-only" /><span aria-hidden="true">{index + 1}</span></span><span className="text-xs text-fg-muted">{value}</span></label>)}
        </div>
      </fieldset>
      <section className={questionClass}>
        <label htmlFor="feedback-useful"><QuestionTitle number={4} optional>¿Qué te resultó más útil?</QuestionTitle></label>
        <textarea id="feedback-useful" name="useful" value={useful} onChange={(event) => setUseful(event.target.value)} maxLength={1000} rows={3} placeholder="Por ejemplo: encontrar todo en un lugar, los filtros, publicar mi evento…" className={textAreaClass} />
      </section>
      <section className={questionClass}>
        <label htmlFor="feedback-improve"><QuestionTitle number={5} optional>Sugerencias de mejora: ¿qué te gustaría ver?</QuestionTitle></label>
        <p id="feedback-improve-hint" className="mt-1 text-sm text-fg-muted">Puede ser algo confuso, una función que te gustaría o una idea.</p>
        <textarea id="feedback-improve" name="improve" value={improve} onChange={(event) => setImprove(event.target.value)} aria-describedby="feedback-improve-hint" maxLength={1000} rows={3} placeholder="Nos sirve más una opinión honesta que una respuesta perfecta." className={textAreaClass} />
      </section>
      <div className="pt-3">
        {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}
        <button type="submit" disabled={sending} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-pill bg-lime px-6 py-3 font-medium text-primary-fg transition-shadow hover:shadow-glow-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-wait disabled:opacity-60">{sending ? 'Guardando…' : 'Enviar respuestas'} <span aria-hidden="true">↗</span></button>
        <p className="mt-3 text-center text-xs text-fg-muted">Las primeras 3 preguntas son obligatorias. Las últimas 2, opcionales.</p>
        {!demo && <p className="mt-3 text-center text-xs leading-relaxed text-fg-muted">Al enviar, tus respuestas quedan asociadas al nombre y correo con los que publicaste tu evento. Las usamos para mejorar Condor Nest y gestionar tu descuento; no te suscribimos a ningún mail.</p>}
      </div>
    </form>
  );
}
