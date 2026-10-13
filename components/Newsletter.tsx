'use client';
import { useState } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence, useReducedMotion } from 'motion/react';
import { useReduceMotionPref } from './Toggles';
type St = 'idle' | 'submitting' | 'success' | 'already' | 'invalid' | 'error';
const MSG: Partial<Record<St, string>> = { success: '¡Listo! Revisá tu mail para confirmar.', already: 'Ya estabas suscripto 🙌', invalid: 'Revisá el email, parece incompleto.', error: 'No pudimos suscribirte. Probá de nuevo en un rato.' };

export function Newsletter({ variant = 'inline' }: { variant?: 'inline' | 'compact' | 'footer' }) {
  const [st, setSt] = useState<St>('idle'); const [email, setEmail] = useState(''); const [shake, setShake] = useState(0);
  const still = !!useReducedMotion() || useReduceMotionPref();
  const done = st === 'success' || st === 'already';
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setSt('invalid'); setShake((s) => s + 1); return; }
    setSt('submitting');
    try { const r = await fetch('/api/newsletter', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) }); const j = await r.json(); setSt((j.status as St) ?? 'error'); if (!['success', 'already'].includes(j.status)) setShake((s) => s + 1); }
    catch { setSt('error'); setShake((s) => s + 1); }
  }
  const id = `nl-${variant}`;
  const err = st === 'invalid' || st === 'error';
  return (
    <LazyMotion features={domAnimation}>
      <section aria-labelledby={`${id}-t`} className={`rounded-card border border-border bg-surface p-4 ${variant === 'compact' ? '' : 'sm:p-6'}`}>
        <h2 id={`${id}-t`} className="font-medium text-lg">Las mejores oportunidades, cada lunes</h2>
        {variant !== 'compact' && <p className="mt-1 text-sm text-fg-muted">Un mail por semana con lo que cierra pronto y lo que tiene poca competencia. Sin spam.</p>}
        <AnimatePresence initial={false}>
          {!done && (
            <m.form key="f" onSubmit={submit} noValidate className="mt-3 overflow-hidden" exit={still ? undefined : { height: 0, opacity: 0, transition: { duration: 0.24 } }}>
              <label htmlFor={id} className="mb-1 block text-sm">Tu email</label>
              <m.div key={shake} className="flex gap-2" animate={still || !shake ? undefined : { x: [0, -6, 6, -4, 4, 0] }} transition={{ duration: 0.32 }}>
                <input id={id} type="email" autoComplete="email" required value={email} onChange={(e) => { setEmail(e.target.value); if (err) setSt('idle'); }}
                  aria-invalid={err} aria-describedby={`${id}-m`}
                  className={`min-h-tap w-full min-w-0 rounded-pill border bg-surface-2 px-4 text-base text-fg placeholder:text-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-lime ${err ? 'border-danger shadow-[0_0_0_1px_rgb(var(--danger)/.6),0_0_16px_-4px_rgb(var(--danger)/.5)]' : 'border-border'}`} />
                <m.button layout={!still} type="submit" disabled={st === 'submitting'} aria-label={st === 'submitting' ? 'Enviando…' : undefined}
                  className={`min-h-tap shrink-0 rounded-pill bg-lime font-medium text-primary-fg transition-shadow duration-fast hover:shadow-glow-lime active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${st === 'submitting' ? 'grid w-tap place-items-center' : 'px-5'}`}>
                  {st === 'submitting' ? <span className="h-5 w-5 animate-spin rounded-pill border-2 border-primary-fg/30 border-t-primary-fg [animation-duration:800ms]" /> : 'Suscribirme'}
                </m.button>
              </m.div>
            </m.form>
          )}
        </AnimatePresence>
        <div id={`${id}-m`} aria-live="polite" className="mt-2 min-h-5 text-sm">
          {done && (
            <p className="flex items-center gap-2 font-medium">
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="text-lime"><m.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" initial={still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }} /></svg>
              <m.span className={st === 'success' ? 'text-gradient' : ''} initial={still ? false : { clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: 0.6, delay: 0.2 }}>{MSG[st]}</m.span>
            </p>
          )}
          {err && <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-danger">{MSG[st]}</m.p>}
        </div>
        <p className="mt-1 text-xs text-fg-muted">Podés darte de baja cuando quieras.</p>
      </section>
    </LazyMotion>
  );
}
