'use client';
import { useEffect, useRef, useState } from 'react';
const TS_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
import { LazyMotion, domAnimation, m, AnimatePresence, useReducedMotion } from 'motion/react';
import { useReduceMotionPref } from './Toggles';
type St = 'idle' | 'submitting' | 'success' | 'saved' | 'already' | 'invalid' | 'error';
const MSG: Partial<Record<St, string>> = { success: '¡Listo! Revisá tu mail para confirmar.', saved: 'Te anotamos, pero no pudimos enviarte el mail de confirmación. Probá de nuevo en un rato.', already: 'Ya estabas suscripto 🙌', invalid: 'Revisá el email, parece incompleto.', error: 'No pudimos suscribirte. Probá de nuevo en un rato.' };

export function Newsletter({ variant = 'inline' }: { variant?: 'inline' | 'compact' | 'footer' | 'mini' }) {
  const [st, setSt] = useState<St>('idle'); const [email, setEmail] = useState(''); const [shake, setShake] = useState(0);
  const tsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!TS_KEY || document.getElementById('cf-ts')) return;
    const sc = document.createElement('script'); sc.id = 'cf-ts'; sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; sc.async = true; document.head.appendChild(sc);
  }, []);
  const still = !!useReducedMotion() || useReduceMotionPref();
  const done = st === 'success' || st === 'already' || st === 'saved';
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setSt('invalid'); setShake((s) => s + 1); return; }
    setSt('submitting');
    try { const r = await fetch('/api/newsletter', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, turnstileToken: (tsRef.current?.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value }) }); const j = await r.json(); setSt((j.status as St) ?? 'error'); if (!['success', 'already', 'saved'].includes(j.status)) setShake((s) => s + 1); }
    catch { setSt('error'); setShake((s) => s + 1); }
  }
  const id = `nl-${variant}`;
  const mini = variant === 'mini';
  const err = st === 'invalid' || st === 'error';
  return (
    <LazyMotion features={domAnimation}>
      <section aria-labelledby={`${id}-t`} className={mini ? 'text-sm' : `rounded-card border border-violet/35 [background:radial-gradient(120%_140%_at_0%_0%,rgb(var(--violet)/.18),transparent_60%),rgb(var(--surface))] ${variant === 'compact' ? 'p-[18px]' : 'p-5'}`}>
        {mini ? <h2 id={`${id}-t`} className="mb-2 text-sm text-fg-muted">Novedades cada lunes, por mail</h2> : variant === 'compact'
          ? <><h2 id={`${id}-t`} className="font-display text-base font-semibold">Cada lunes, en tu mail</h2><p className="mb-3.5 mt-1.5 text-sm text-fg-muted">Lo que cierra pronto y lo que tiene poca competencia.</p></>
          : <><h2 id={`${id}-t`} className="font-display text-lg font-semibold leading-6">Las mejores oportunidades, cada lunes</h2><p className="mb-3.5 mt-1.5 text-sm text-fg-muted">Un mail por semana con lo que cierra pronto y lo que tiene poca competencia. Sin spam.</p></>}
        <AnimatePresence initial={false}>
          {!done && (
            <m.form key="f" onSubmit={submit} noValidate className="overflow-hidden" exit={still ? undefined : { height: 0, opacity: 0, transition: { duration: 0.24 } }}>
              <label htmlFor={id} className={variant === 'compact' || mini ? 'sr-only' : 'mb-2 block text-[13px] text-fg-muted'}>Tu email</label>
              <m.div key={shake} className={mini ? 'flex gap-2' : 'flex flex-col gap-2'} animate={still || !shake ? undefined : { x: [0, -6, 6, -4, 4, 0] }} transition={{ duration: 0.32 }}>
                <input id={id} type="email" placeholder="vos@ejemplo.com" autoComplete="email" required value={email} onChange={(e) => { setEmail(e.target.value); if (err) setSt('idle'); }}
                  aria-invalid={err} aria-describedby={`${id}-m`}
                  style={{ ['--fx-fill' as string]: 'rgb(var(--bg))' }} className={`fx-input ${mini ? 'h-10 text-sm' : 'h-12'} w-full min-w-0 rounded-[12px] border bg-bg px-3.5 ${mini ? '' : 'text-base'} text-fg placeholder:text-fg-muted ${err ? 'border-danger shadow-[0_0_0_1px_rgb(var(--danger)/.6),0_0_16px_-4px_rgb(var(--danger)/.5)]' : 'border-border'}`} />
                <m.button layout={!still} type="submit" disabled={st === 'submitting'} aria-label={st === 'submitting' ? 'Enviando…' : undefined}
                  className={`btn-sweep ${mini ? 'h-10 shrink-0 px-4 text-sm' : 'h-12 w-full'} rounded-[12px] bg-lime font-bold text-primary-fg shadow-[0_0_24px_-6px_rgb(var(--lime)/.6)] transition-shadow duration-fast active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bg grid place-items-center`}>
                  {st === 'submitting' ? <span className="h-5 w-5 animate-spin rounded-pill border-2 border-primary-fg/30 border-t-primary-fg [animation-duration:800ms]" /> : 'Suscribirme'}
                </m.button>
              </m.div>
              {TS_KEY && <div ref={tsRef} className="cf-turnstile mt-2" data-sitekey={TS_KEY} />}
            </m.form>
          )}
        </AnimatePresence>
        <div id={`${id}-m`} aria-live="polite" className={`text-sm ${done || err ? 'mt-2' : ''}`}>
          {done && (
            <p className="flex items-center gap-2 font-medium">
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="text-lime"><m.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" initial={still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }} /></svg>
              <m.span className={st === 'success' ? 'text-gradient' : ''} initial={still ? false : { clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: 0.6, delay: 0.2 }}>{MSG[st]}</m.span>
            </p>
          )}
          {err && <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-danger">{MSG[st]}</m.p>}
        </div>
        {variant !== 'compact' && !mini && <p className="mt-2.5 text-xs text-fg-muted">Podés darte de baja cuando quieras.</p>}
      </section>
    </LazyMotion>
  );
}
