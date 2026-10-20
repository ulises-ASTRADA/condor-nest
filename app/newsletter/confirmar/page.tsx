import Link from 'next/link';
import type { Metadata } from 'next';
import AutoConfirm from './AutoConfirm';
import { SECONDARY } from './styles';
import { Newsletter } from '@/components/Newsletter';
export const metadata: Metadata = { title: 'Confirmá tu suscripción', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
const ok = (t: unknown): t is string => typeof t === 'string' && /^[0-9a-f]{64}$/.test(t);
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 py-16">
      <section className="w-full rounded-card border border-violet/35 p-8 text-center [background:radial-gradient(120%_140%_at_0%_0%,rgb(var(--violet)/.18),transparent_60%),rgb(var(--surface))]">
        <p className="font-mono text-xs tracking-[.18em] text-lime">NEWSLETTER</p>
        {ok(token) ? (<>
          <AutoConfirm token={token} />
          <noscript>
            <form method="post" action="/api/newsletter/confirm" className="mt-7">
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="inline-grid h-12 place-items-center rounded-[12px] bg-lime px-6 font-bold text-primary-fg">Confirmar suscripción</button>
            </form>
          </noscript>
        </>) : (<>
          <h1 className="mt-3 font-display text-2xl font-semibold">Este link ya venció</h1>
          <p className="mt-3 text-fg-muted">Está incompleto o venció. Poné tu mail y te mandamos uno nuevo.</p>
          <Newsletter variant="resub" />
          <Link href="/" className={SECONDARY}>Ver oportunidades</Link>
        </>)}
      </section>
    </div>
  );
}
