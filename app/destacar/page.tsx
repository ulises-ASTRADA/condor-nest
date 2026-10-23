import type { Metadata } from 'next';
import { FeaturedForm } from '@/components/FeaturedForm';
import { isToken, sha256 } from '@/lib/email';
import { serverRpc } from '@/lib/server-supabase';
import { featuredPrefill, type FeaturedInvitation } from '@/lib/featured-invitation';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Destacá tu evento',
  description: 'Elegí la duración del destacado y calculá el precio de tu campaña.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
  alternates: { canonical: '/destacar' },
};

export default async function FeaturedPage({ searchParams }: { searchParams: Promise<{ solicitud?: string | string[] }> }) {
  const params = await searchParams;
  const hasInvitation = params.solicitud !== undefined;
  const token = typeof params.solicitud === 'string' ? params.solicitud : undefined;
  const demo = process.env.NODE_ENV === 'development' && !hasInvitation;
  let invitation: FeaturedInvitation = { status: 'invalid' };
  let failed = false;
  if (token && isToken(token)) {
    try { invitation = await serverRpc('cn_featured_invite_read', { p_token_hash: sha256(token) }) as FeaturedInvitation; }
    catch { failed = true; }
  }
  if (hasInvitation && invitation.status !== 'available') return <article className="mx-auto max-w-2xl py-8 sm:py-12">
    <section className="rounded-card border border-border bg-surface p-6">
      <h1 className="font-display text-2xl font-semibold">{failed ? 'No pudimos abrir tu formulario' : invitation.status === 'expired' ? 'Este enlace venció' : 'Este enlace no está disponible'}</h1>
      <p className="mt-4 text-fg-muted">{failed ? 'Probá recargando la página en unos minutos.' : 'El formulario precompletado tiene una vigencia de 5 días. Respondé al mail en el que te lo compartimos para pedir un nuevo enlace.'}</p>
    </section>
  </article>;
  return <article className="mx-auto max-w-5xl py-8 sm:py-12">
    {demo && <div className="mb-6 inline-flex rounded-pill border border-cyan/30 bg-cyan/5 px-3 py-1.5 font-mono text-xs text-cyan">Vista de prueba · precios propuestos · no genera cargos ni envíos</div>}
    <header className="mb-8 max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[.14em] text-magenta">Un impulso para tu convocatoria</p>
      <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Dale más visibilidad<br className="hidden sm:block" /> a tu próximo evento.</h1>
      <p className="mt-4 leading-relaxed text-fg-muted">Elegí cuántos días querés aparecer en el espacio Destacado. El precio se actualiza al momento y podés aplicar tu código antes de continuar.</p>
      <p className="mt-3 text-sm text-fg-muted">Publicar tu evento sigue siendo gratis. El destacado suma visibilidad, siempre identificado como un espacio pago.</p>
    </header>
    <FeaturedForm
      key={token ?? 'new'}
      event={invitation.status === 'available' ? featuredPrefill(invitation.submission) : { title: '', organizer: '', email: '' }}
      demo={demo}
      invitationToken={invitation.status === 'available' ? token : undefined}
      originalSubmission={invitation.status === 'available' ? invitation.submission : undefined}
      invitationExpiresAt={invitation.status === 'available' ? invitation.expires_at : undefined}
    />
  </article>;
}
