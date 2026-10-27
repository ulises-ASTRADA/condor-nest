'use client';
import { useRef, useState } from 'react';
import { Turnstile, type TurnstileHandle } from './Turnstile';
type St = 'idle' | 'submitting' | 'success' | 'recent' | 'saved' | 'already' | 'invalid' | 'error';
const MSG: Partial<Record<St, string>> = { success: 'Te enviamos un mail. Abrilo y tocá “Confirmar” para activar tu suscripción.', recent: 'Ya solicitaste un mail hace menos de una hora. Revisá Spam o Promociones y, si no aparece, pedí otro después de una hora.', saved: 'Te anotamos, pero el mail de confirmación no pudo salir. Volvé a pedirlo después de una hora.', already: 'Ya estás suscripto a Condor Nest. Si no estás recibiendo nuestros mails, revisá las carpetas Spam y Promociones.', invalid: 'Revisá el email, parece incompleto.', error: 'No pudimos suscribirte. Probá de nuevo en un rato.' };

export function Newsletter({ variant = 'inline' }: { variant?: 'inline' | 'compact' | 'footer' | 'mini' | 'resub' }) {
  const [st, setSt] = useState<St>('idle'); const [email, setEmail] = useState(''); const [shake, setShake] = useState(0);
  const ts = useRef<TurnstileHandle>(null);
  const done = st === 'success' || st === 'recent' || st === 'already' || st === 'saved';
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setSt('invalid'); setShake((s) => s + 1); return; }
    setSt('submitting');
    try { const r = await fetch('/api/newsletter', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, turnstileToken: await ts.current?.token() }) }); ts.current?.reset(); const j = await r.json(); setSt((j.status as St) ?? 'error'); if (!['success', 'recent', 'already', 'saved'].includes(j.status)) setShake((s) => s + 1); }
    catch { setSt('error'); setShake((s) => s + 1); }
  }
  const id = `nl-${variant}`;
  const mini = variant === 'mini'; const resub = variant === 'resub';
  const err = st === 'invalid' || st === 'error';
  return (
      <section aria-labelledby={`${id}-t`} className={mini ? 'text-sm' : resub ? 'mt-7 text-left' : `rounded-card border border-violet/35 [background:radial-gradient(120%_140%_at_0%_0%,rgb(var(--violet)/.18),transparent_60%),rgb(var(--surface))] ${variant === 'compact' ? 'px-4 py-[18px]' : 'p-5'}`}>
        {mini ? <h2 id={`${id}-t`} className="mb-2 text-sm text-fg-muted">Novedades por mail, sin spam.</h2> : resub ? <h2 id={`${id}-t`} className="sr-only">Pedir un link nuevo</h2> : variant === 'compact'
          ? <><h2 id={`${id}-t`} className="font-display text-base font-semibold">Novedades en tu mail</h2><p className="mb-3.5 mt-1.5 text-sm text-fg-muted">Lo que cierra pronto y lo que tiene poca competencia.</p></>
          : <><h2 id={`${id}-t`} className="font-display text-lg font-semibold leading-6">Las mejores oportunidades, en tu mail</h2><p className="mb-3.5 mt-1.5 text-sm text-fg-muted">Te mandamos lo que cierra pronto y lo que tiene poca competencia. Sin spam.</p></>}
          {!done && (
            <form onSubmit={submit} noValidate>
              <label htmlFor={id} className={variant === 'compact' || mini || resub ? 'sr-only' : 'mb-2 block text-[13px] text-fg-muted'}>Tu email</label>
              <div key={shake} className={`${mini ? 'flex gap-2' : 'flex flex-col gap-2'} ${shake ? 'cn-shake' : ''}`}>
                <input id={id} type="email" placeholder="vos@ejemplo.com" autoComplete="email" required value={email} onChange={(e) => { setEmail(e.target.value); if (err) setSt('idle'); }}
                  aria-invalid={err} aria-describedby={`${id}-m`}
                  style={{ ['--fx-fill' as string]: 'rgb(var(--bg))' }} className={`fx-input ${mini ? 'h-10 text-sm' : 'h-12'} w-full min-w-0 rounded-[12px] border bg-bg px-3.5 ${mini ? '' : 'text-base'} text-fg placeholder:text-fg-muted ${err ? 'border-danger shadow-[0_0_0_1px_rgb(var(--danger)/.6),0_0_16px_-4px_rgb(var(--danger)/.5)]' : 'border-border'}`} />
                <button type="submit" disabled={st === 'submitting'} aria-label={st === 'submitting' ? 'Enviando…' : undefined}
                  className={`btn-sweep ${mini ? 'h-10 shrink-0 px-4 text-sm' : 'h-12 w-full'} rounded-[12px] bg-lime font-bold text-primary-fg shadow-[0_0_24px_-6px_rgb(var(--lime)/.6)] transition-shadow duration-fast active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bg grid place-items-center`}>
                  {st === 'submitting' ? <span className="h-5 w-5 animate-spin rounded-pill border-2 border-primary-fg/30 border-t-primary-fg [animation-duration:800ms]" /> : resub ? 'Mandame un link nuevo' : 'Suscribirme'}
                </button>
              </div>
              <Turnstile ref={ts} />
            </form>
          )}
        <div id={`${id}-m`} aria-live="polite" className={`text-sm ${done || err ? 'mt-2' : ''}`}>
          {done && (
            <p className="flex items-start gap-2 font-medium">
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 shrink-0 text-lime"><path className="cn-check" pathLength={1} d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
              <span className={`cn-fade ${st === 'success' ? 'text-gradient' : ''}`}>{MSG[st]}</span>
            </p>
          )}
          {st === 'success' && <p className="cn-fade mt-1 pl-[30px] text-xs text-fg-muted">Si no lo ves en unos minutos, revisá Spam o Promociones. El enlace vence en 48 horas.</p>}
          {err && <p className="cn-fade text-danger">{MSG[st]}</p>}
        </div>
        {(st === 'success' || st === 'recent' || st === 'saved') && <p className="mt-3 text-xs text-fg-muted">Podés pedir otro correo una hora después del anterior. <button type="button" onClick={() => setSt('idle')} className="text-lime underline underline-offset-4 hover:text-fg">Pedir otro correo</button></p>}
        {variant !== 'compact' && !mini && <p className="mt-2.5 text-xs text-fg-muted">Podés darte de baja cuando quieras.</p>}
      </section>
  );
}
