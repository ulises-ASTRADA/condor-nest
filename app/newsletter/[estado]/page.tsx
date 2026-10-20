import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Newsletter } from '@/components/Newsletter';
import { SECONDARY } from '../confirmar/styles';
export const metadata: Metadata = { title: 'Newsletter', robots: { index: false, follow: false } };
const COPY: Record<string, { k: string; t: string; d: string; ok: boolean }> = {
  confirmado: { k: 'SUSCRIPCIÓN ACTIVA', t: '¡Listo, ya estás suscripto!', d: 'El lunes te llega el primero.', ok: true },
  baja: { k: 'BAJA CONFIRMADA', t: 'Te diste de baja', d: 'No te vamos a escribir más. Si cambiás de idea, te podés volver a suscribir desde el inicio.', ok: true },
  invalido: { k: 'LINK INVÁLIDO', t: 'Este link ya venció', d: 'Poné tu mail y te mandamos uno nuevo. Si ya lo habías confirmado, no tenés que hacer nada.', ok: false },
  error: { k: 'ALGO FALLÓ', t: 'No pudimos procesarlo', d: 'Probá abrir el link de nuevo en un rato.', ok: false },
};
export function generateStaticParams() { return Object.keys(COPY).map((estado) => ({ estado })); }
export default async function Page({ params }: { params: Promise<{ estado: string }> }) {
  const { estado } = await params; const c = COPY[estado]; if (!c) notFound();
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 py-16">
      <section className="w-full rounded-card border border-violet/35 p-8 text-center [background:radial-gradient(120%_140%_at_0%_0%,rgb(var(--violet)/.18),transparent_60%),rgb(var(--surface))]">
        <div className={`mx-auto mb-5 grid h-14 w-14 place-items-center rounded-pill border ${c.ok ? 'border-lime/50 text-lime shadow-[0_0_28px_-6px_rgb(var(--lime)/.7)]' : 'border-danger/50 text-danger'}`}>
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d={c.ok ? 'M5 12.5l4.5 4.5L19 7.5' : 'M7 7l10 10M17 7L7 17'} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
        </div>
        <p className="font-mono text-xs tracking-[.18em] text-lime">{c.k}</p>
        <h1 className="mt-3 font-display text-2xl font-semibold"><span className={c.ok ? 'inline-block text-gradient [-webkit-box-decoration-break:clone] [box-decoration-break:clone]' : ''}>{c.t.includes('\n') ? c.t.split('\n').map((l, i) => <span key={i} className={i ? 'block whitespace-nowrap' : 'block'}>{l}</span>) : c.t}</span></h1>
        <p className="mt-3 text-fg-muted">{c.d}</p>
        {estado === 'invalido' && <Newsletter variant="resub" />}
        <Link href="/" className={estado === 'invalido' ? SECONDARY : 'btn-sweep mt-7 inline-grid h-12 place-items-center rounded-[12px] bg-lime px-6 font-bold text-primary-fg shadow-[0_0_24px_-6px_rgb(var(--lime)/.6)]'}>Ver oportunidades</Link>
      </section>
    </div>
  );
}
