import { OG_IMAGE } from '@/lib/site';
import { PublicarForm } from '@/components/PublicarForm';
export const metadata = {
  title: 'Publicá tu evento',
  description: 'Mandanos tu hackathon, bounty o grant abierto a builders de LatAm. Lo verificamos en su página oficial y lo listamos gratis en Condor Nest.',
  alternates: { canonical: '/publicar' }, openGraph: { images: [OG_IMAGE], url: '/publicar' },
};
export default function Publicar() {
  return (
    <article className="relative mx-auto max-w-2xl space-y-6 py-10">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[.14em] text-cyan">Publicá tu evento</p>
        <h1 className="font-display text-3xl font-semibold">¿Organizás un hackathon? Publicalo gratis o destacalo</h1>
        <p className="text-fg-muted">Listamos gratis cualquier hackathon, bounty o grant abierto a builders de LatAm una vez que lo verificamos en su página oficial. Completá el formulario y te contactamos.</p>
        <p className="text-sm text-fg-muted"><strong className="text-fg">Espacio pago · ¿Qué es esto?</strong> Un “Destacado” ocupa un lugar reservado arriba del feed, siempre con la etiqueta “Destacado”. No se saltea los filtros ni sube en el orden “Menos competencia”.</p>
      </header>
      <PublicarForm />
    </article>
  );
}
