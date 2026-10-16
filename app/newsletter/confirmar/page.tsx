import Link from 'next/link';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Confirmá tu suscripción · Condor Nest', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
const ok = (t: unknown): t is string => typeof t === 'string' && /^[0-9a-f]{64}$/.test(t);
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 py-16">
      <section className="w-full rounded-card border border-violet/35 p-8 text-center [background:radial-gradient(120%_140%_at_0%_0%,rgb(var(--violet)/.18),transparent_60%),rgb(var(--surface))]">
        <p className="font-mono text-xs tracking-[.18em] text-lime">NEWSLETTER</p>
        {ok(token) ? (<>
          <h1 className="mt-3 font-display text-2xl font-semibold">Confirmá tu suscripción</h1>
          <p className="mt-3 text-fg-muted">Tocá el botón para recibir cada lunes lo que cierra pronto y lo que tiene poca competencia. Si no fuiste vos, cerrá esta página.</p>
          <form method="post" action="/api/newsletter/confirm" className="mt-7">
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="inline-grid h-12 place-items-center rounded-[12px] bg-lime px-6 font-bold text-primary-fg shadow-[0_0_24px_-6px_rgb(var(--lime)/.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bg">Confirmar suscripción</button>
          </form>
        </>) : (<>
          <h1 className="mt-3 font-display text-2xl font-semibold">Este link no funciona</h1>
          <p className="mt-3 text-fg-muted">Puede que esté incompleto o vencido. Suscribite de nuevo desde el inicio y te mandamos uno nuevo.</p>
          <Link href="/" className="mt-7 inline-grid h-12 place-items-center rounded-[12px] bg-lime px-6 font-bold text-primary-fg">Ver oportunidades</Link>
        </>)}
      </section>
    </main>
  );
}
