import { OG_BASE } from '@/lib/site';
import { PublicarForm } from '@/components/PublicarForm';
const DESC = 'Mandanos tu hackathon, bounty o grant abierto a builders de LatAm. Lo verificamos en su página oficial y lo listamos gratis en Condor Nest.';
// og:image / twitter:image come from ./opengraph-image.tsx (its own 1200×630 card for this page).
export const metadata = {
  title: 'Publicá tu evento',
  description: DESC,
  alternates: { canonical: '/publicar' }, openGraph: { ...OG_BASE, url: '/publicar' },
  twitter: { card: 'summary_large_image', title: 'Publicá tu evento · Condor Nest', description: DESC },
};
export default function Publicar() {
  return (
    <article className="relative mx-auto max-w-2xl space-y-6 py-10">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[.14em] text-cyan">Publicá tu evento</p>
        <h1 className="font-display text-3xl font-semibold">¿Organizás un hackathon? Publicalo gratis o destacalo</h1>
        <p className="text-fg-muted">Listamos gratis cualquier hackathon, bounty o grant abierto a builders de LatAm una vez que lo verificamos en su página oficial. Completá el formulario y te contactamos.</p>
      </header>
      <section aria-labelledby="featured-cta-title" className="relative overflow-hidden rounded-card border border-lime/50 p-5 shadow-[0_0_32px_-16px_rgb(var(--lime)/.5)] [background:radial-gradient(100%_160%_at_100%_0%,rgb(var(--lime)/.1),transparent_70%),rgb(var(--surface))] sm:p-6">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[.12em] text-lime"><span aria-hidden="true">★</span> Destacado <span className="ml-auto rounded-pill border border-lime/25 px-2 py-1 text-[10px] tracking-normal">Espacio pago</span></p>
        <h2 id="featured-cta-title" className="mt-3 font-display text-xl font-semibold sm:text-2xl">Dale más visibilidad a tu evento</h2>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">Reservá un lugar arriba del feed durante 7, 14 o 30 días, siempre con la etiqueta Destacado.</p>
        <a href="/destacar" className="btn-sweep mt-5 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-[12px] bg-lime px-5 py-3 font-bold text-primary-fg shadow-[0_0_24px_-8px_rgb(var(--lime)/.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:w-auto">Destacar mi evento <span aria-hidden="true">→</span></a>
        <p className="mt-3 text-xs leading-relaxed text-fg-muted">Elegí tu plan y aplicá tu código de descuento, si tenés uno. Publicar gratis sigue disponible en el formulario de abajo.</p>
      </section>
      <PublicarForm />
    </article>
  );
}
