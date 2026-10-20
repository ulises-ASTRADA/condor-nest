import Link from 'next/link';
import type { Metadata } from 'next';
import { PRIMARY, SECONDARY } from '../confirmar/styles';
// noindex comes from next.config headers for /newsletter/*; no-referrer keeps the token out of Referer headers.
export const metadata: Metadata = { title: 'Darte de baja', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export const dynamic = 'force-dynamic';
const ok = (t: unknown): t is string => typeof t === 'string' && /^[0-9a-f]{64}$/.test(t);
// The unsubscribe only happens on POST (this form, or RFC 8058 one-click from the mail client); opening the link never unsubscribes.
function Form({ token, label }: { token: string; label: string }) {
  return (
    <form method="post" action="/api/newsletter/unsubscribe" className="mt-7">
      <input type="hidden" name="token" value={token} />
      <button type="submit" className={PRIMARY.replace('mt-7 ', '')}>{label}</button>
    </form>
  );
}
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string; estado?: string }> }) {
  const { token, estado } = await searchParams;
  const st = estado === 'ok' ? 'ok' : estado === 'error' ? 'error' : estado === 'invalido' || !ok(token) ? 'invalido' : 'confirmar';
  const C = {
    confirmar: { k: 'NEWSLETTER', t: '¿Te damos de baja?', d: 'Si confirmás, no te mandamos más mails de Condor Nest. Podés volver a suscribirte cuando quieras.' },
    ok: { k: 'BAJA CONFIRMADA', t: 'Listo, te diste de baja', d: 'No te vamos a escribir más. Si cambiás de idea, te podés volver a suscribir desde el inicio.' },
    invalido: { k: 'LINK INVÁLIDO', t: 'Este link no funciona', d: 'Puede que esté incompleto o que ya lo hayas usado. Si ya te diste de baja, no tenés que hacer nada.' },
    error: { k: 'ALGO FALLÓ', t: 'No pudimos darte de baja', d: 'Puede ser la conexión. Probá de nuevo.' },
  }[st];
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 py-16">
      <section data-state={st} className="w-full rounded-card border border-violet/35 p-8 text-center [background:radial-gradient(120%_140%_at_0%_0%,rgb(var(--violet)/.18),transparent_60%),rgb(var(--surface))]">
        <p className="font-mono text-xs tracking-[.18em] text-lime">{C.k}</p>
        <h1 className="mt-3 font-display text-2xl font-semibold">{C.t}</h1>
        <p className="mt-3 text-fg-muted">{C.d}</p>
        {st === 'confirmar' && ok(token) && <Form token={token} label="Darme de baja" />}
        {st === 'error' && ok(token) && <Form token={token} label="Reintentar" />}
        <div><Link href="/" className={st === 'ok' || st === 'invalido' ? PRIMARY : SECONDARY}>{st === 'confirmar' ? 'No, quiero seguir' : 'Ver oportunidades'}</Link></div>
      </section>
    </div>
  );
}
