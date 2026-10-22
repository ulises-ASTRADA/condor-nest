import type { Metadata } from 'next';
import { FeaturedForm } from '@/components/FeaturedForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Destacá tu evento',
  description: 'Elegí la duración del destacado y calculá el precio de tu campaña.',
  robots: { index: false, follow: false },
};

export default function FeaturedPage() {
  const demo = process.env.NODE_ENV === 'development';
  return <article className="mx-auto max-w-5xl py-8 sm:py-12">
    {demo && <div className="mb-6 inline-flex rounded-pill border border-cyan/30 bg-cyan/5 px-3 py-1.5 font-mono text-xs text-cyan">Vista de prueba · precios propuestos · no genera cargos ni envíos</div>}
    <header className="mb-8 max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[.14em] text-magenta">Un impulso para tu convocatoria</p>
      <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Dale más visibilidad<br className="hidden sm:block" /> a tu próximo evento.</h1>
      <p className="mt-4 leading-relaxed text-fg-muted">Elegí cuántos días querés aparecer en el espacio Destacado. El precio se actualiza al momento y podés aplicar tu código antes de continuar.</p>
      <p className="mt-3 text-sm text-fg-muted">Publicar tu evento sigue siendo gratis. El destacado suma visibilidad, siempre identificado como un espacio pago.</p>
    </header>
    <FeaturedForm event={{ title: '', organizer: '', email: '' }} demo={demo} />
  </article>;
}
