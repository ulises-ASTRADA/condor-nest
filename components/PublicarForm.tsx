'use client';
import { useRef, useState } from 'react';
import { Turnstile, type TurnstileHandle } from './Turnstile';
type St = 'idle' | 'sending' | 'ok' | 'invalid' | 'rate' | 'error';
type Errs = Partial<Record<string, string>>;
const inputCls = (bad?: boolean) => `fx-input h-12 w-full min-w-0 rounded-[12px] border bg-bg px-3.5 text-base text-fg placeholder:text-fg-muted ${bad ? 'border-danger shadow-[0_0_0_1px_rgb(var(--danger)/.6)]' : 'border-border'}`;

function Field({ id, label, hint, err, req, children }: { id: string; label: string; hint?: string; err?: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] text-fg-muted">{label}{req && <span className="text-danger" aria-hidden="true"> *</span>}{req && <span className="sr-only"> (obligatorio)</span>}</label>
      {children}
      {err ? <p id={`${id}-e`} className="mt-1 text-sm text-danger">{err}</p> : hint ? <p className="mt-1 text-xs text-fg-muted">{hint}</p> : null}
    </div>
  );
}

export function PublicarForm() {
  const [st, setSt] = useState<St>('idle'); const ts = useRef<TurnstileHandle>(null);
  const [errs, setErrs] = useState<Errs>({});
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)])) as Record<string, any>;
    body.wants_featured = fd.get('wants_featured') === 'on';
    const local: Errs = {};
    const t = (k: string) => String(body[k] ?? '').trim();
    if (t('name').length < 2) local.name = 'Tu nombre es obligatorio (mínimo 2 letras).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t('email'))) local.email = 'Revisá el email.';
    if (t('event_name').length < 3) local.event_name = 'El nombre del evento es obligatorio (mínimo 3 caracteres).';
    if (t('location').length < 2) local.location = 'El país es obligatorio: poné país y ciudad, u “Online”.';
    if (t('dates').length < 2) local.dates = 'Las fechas son obligatorias.';
    try { const u = new URL(t('url')); if (u.protocol !== 'https:') throw 0; } catch { local.url = 'Necesitamos el link oficial con https:// (no aceptamos http://).'; }
    if (Object.keys(local).length) { setErrs(local); setSt('invalid'); return; }
    setSt('sending'); setErrs({});
    try {
      const r = await fetch('/api/publicar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, turnstileToken: await ts.current?.token() }) }); ts.current?.reset();
      const j = await r.json().catch(() => ({}));
      if (j.status === 'ok') { setSt('ok'); return; }
      if (j.status === 'invalid') { setErrs(j.errors ?? {}); setSt('invalid'); return; }
      setSt(j.status === 'rate' ? 'rate' : 'error');
    } catch { setSt('error'); }
  }
  if (st === 'ok') return (
    <div role="status" className="rounded-card border border-lime/50 bg-surface p-6 shadow-[0_0_32px_-12px_rgb(var(--lime)/.6)]">
      <p className="font-mono text-xs uppercase tracking-[.14em] text-lime">Recibido</p>
      <h2 className="mt-2 font-display text-2xl font-semibold">Lo recibimos, te contactamos pronto</h2>
      <p className="mt-2 text-fg-muted">Lo verificamos en la página oficial y, si está abierto a builders de LatAm, lo sumamos al feed. Si nos falta algún dato, te escribimos al mail que dejaste.</p>
    </div>
  );
  const ar = (k: string) => ({ 'aria-invalid': !!errs[k], 'aria-describedby': errs[k] ? `${k}-e` : undefined });
  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-card border border-violet/35 p-5 [background:radial-gradient(120%_140%_at_0%_0%,rgb(var(--violet)/.16),transparent_60%),rgb(var(--surface))] sm:p-6">
      <p className="text-xs text-fg-muted"><span className="text-danger" aria-hidden="true">*</span> Campos obligatorios</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field req id="name" label="Tu nombre" err={errs.name}><input id="name" name="name" required maxLength={120} autoComplete="name" className={inputCls(!!errs.name)} {...ar('name')} /></Field>
        <Field req id="email" label="Tu email" err={errs.email}><input id="email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="vos@ejemplo.com" className={inputCls(!!errs.email)} {...ar('email')} /></Field>
      </div>
      <Field req id="event_name" label="Nombre del evento" err={errs.event_name}><input id="event_name" name="event_name" required maxLength={200} className={inputCls(!!errs.event_name)} {...ar('event_name')} /></Field>
      <fieldset>
        <legend className="mb-1.5 text-[13px] text-fg-muted">Tipo <span className="text-danger" aria-hidden="true">*</span><span className="sr-only"> (obligatorio)</span></legend>
        <div className="flex flex-wrap gap-2">
          {['hackathon', 'bounty', 'grant'].map((k, i) => (
            <label key={k} className="flex min-h-tap cursor-pointer items-center gap-2 rounded-pill border border-border bg-bg px-4 text-sm has-[:checked]:border-lime has-[:checked]:text-lime">
              <input type="radio" required name="kind" value={k} defaultChecked={i === 0} className="accent-[rgb(var(--lime))]" />{k[0].toUpperCase() + k.slice(1)}
            </label>
          ))}
        </div>
        {errs.kind && <p className="mt-1 text-sm text-danger">{errs.kind}</p>}
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field req id="location" label="País y ciudad, u “Online”" err={errs.location}><input id="location" name="location" required maxLength={160} placeholder="Córdoba, Argentina" className={inputCls(!!errs.location)} {...ar('location')} /></Field>
        <Field req id="dates" label="Fechas" hint="Inicio y cierre de inscripción o entrega." err={errs.dates}><input id="dates" name="dates" required maxLength={160} placeholder="7 al 9 de noviembre de 2026" className={inputCls(!!errs.dates)} {...ar('dates')} /></Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="prize" label="Premio (opcional)" err={errs.prize}><input id="prize" name="prize" maxLength={160} placeholder="USD 5.000 en total" className={inputCls(!!errs.prize)} /></Field>
        <Field req id="url" label="Link oficial" err={errs.url}><input id="url" name="url" type="url" inputMode="url" required maxLength={500} placeholder="https://…" className={inputCls(!!errs.url)} {...ar('url')} /></Field>
      </div>
      <Field id="notes" label="Notas (opcional)" hint="Quién puede participar, requisitos, lo que quieras contarnos." err={errs.notes}>
        <textarea id="notes" name="notes" rows={4} maxLength={2000} className={`${inputCls(!!errs.notes)} h-auto py-3`} />
      </Field>
      {/* honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div aria-live="polite">
        {st === 'invalid' && <p className="text-sm text-danger">Revisá los campos marcados.</p>}
        {st === 'rate' && <p className="text-sm text-danger">Mandaste varios seguidos. Esperá unos minutos y probá de nuevo.</p>}
        {st === 'error' && <p className="text-sm text-danger">No pudimos guardar tu evento. Probá de nuevo en un rato.</p>}
      </div>
      <Turnstile ref={ts} />
      <button type="submit" disabled={st === 'sending'} className="btn-sweep grid h-12 w-full place-items-center rounded-[12px] bg-lime font-bold text-primary-fg shadow-[0_0_24px_-6px_rgb(var(--lime)/.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-70 sm:w-auto sm:px-8">
        {st === 'sending' ? 'Enviando…' : 'Enviar evento'}
      </button>
      <p className="text-xs text-fg-muted">Usamos tu mail solo para hablar de este evento. No te suscribimos a nada.</p>
    </form>
  );
}
