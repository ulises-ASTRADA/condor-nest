export const metadata = { title: 'Publicá tu evento', alternates: { canonical: '/publicar' }, openGraph: { url: '/publicar' } };
export default function Publicar() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 py-10">
      <h1 className="font-display text-3xl font-semibold">¿Organizás un hackathon? Publicalo gratis o destacalo →</h1>
      <p>Listamos gratis cualquier hackathon, bounty o grant abierto a builders de LatAm una vez que lo verificamos en su página oficial.</p>
      <p><strong>Espacio pago · ¿Qué es esto?</strong> Un “Destacado” ocupa un lugar reservado arriba del feed, siempre con la etiqueta “Destacado”. No se saltea los filtros ni sube en el orden “Menos competencia”.</p>
      <p className="text-fg-muted">Formulario de contacto: próximamente.</p>
    </article>
  );
}
