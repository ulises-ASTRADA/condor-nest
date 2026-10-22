import type { Metadata } from 'next';
import { DiscoveryForm } from '@/components/DiscoveryForm';
import { isToken, sha256 } from '@/lib/email';
import type { FeedbackStatus } from '@/lib/feedback';
import { serverRpc } from '@/lib/server-supabase';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: '¿Cómo nos conociste?',
  description: 'Contanos cómo llegaste a Condor Nest y qué podemos mejorar.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
  alternates: { canonical: '/como-nos-conociste' },
};

export default async function DiscoveryPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : undefined;
  const demo = process.env.NODE_ENV === 'development' && !params.token;
  let invitation: FeedbackStatus = { status: 'invalid' };
  let failed = false;
  if (token && isToken(token)) {
    try { invitation = await serverRpc('cn_feedback_status', { p_token_hash: sha256(token) }) as FeedbackStatus; }
    catch { failed = true; }
  }
  const available = demo || invitation.status !== 'invalid';
  return (
    <article className="mx-auto max-w-2xl py-8 sm:py-12">
      {demo && <div className="mb-7 inline-flex items-center gap-2 rounded-pill border border-cyan/30 bg-cyan/5 px-3 py-1.5 font-mono text-xs text-cyan">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan" aria-hidden="true" />
        Vista de prueba · las respuestas no se envían
      </div>}
      <header className="mb-8">
        <p className="mb-3 font-mono text-xs uppercase tracking-[.14em] text-lime">Tu experiencia en Condor Nest</p>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">¿Cómo llegaste<br className="hidden sm:block" /> hasta el nido?</h1>
        <p className="mt-4 max-w-lg leading-relaxed text-fg-muted">Queremos saber cómo nos encontraste y hacer que tu próxima visita sea mejor. Son 5 preguntas y te lleva unos 2 minutos.</p>
        <p className="mt-4 text-xs text-fg-muted">Tu opinión nos ayuda a mejorar</p>
      </header>
      {available ? <DiscoveryForm token={token} demo={demo} initialCoupon={invitation.discount_code} /> : <section className="rounded-card border border-border bg-surface p-6"><h2 className="text-lg font-medium">{failed ? 'No pudimos abrir la encuesta' : 'Abrí tu enlace de invitación'}</h2><p className="mt-2 text-fg-muted">{failed ? 'Probá recargando la página en unos minutos.' : 'La encuesta se completa desde el enlace personal que te compartimos. Si no lo tenés o no funciona, pedinos una nueva invitación.'}</p></section>}
    </article>
  );
}
