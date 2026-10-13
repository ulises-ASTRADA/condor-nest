export const metadata = { title: 'Acerca' };
export default function Acerca() {
  return (
    <article className="mx-auto max-w-2xl space-y-6 py-10">
      <h1 className="font-display text-3xl font-semibold">Acerca de <span className="text-fg">CONDOR</span> <span className="text-gradient">NEST</span></h1>
      <p>Condor Nest junta hackathons, bounties y grants abiertos a builders de Argentina y LatAm en un solo feed en español, actualizado todos los días. Todos los horarios están en hora de Argentina (ART).</p>
      <section id="ranking"><h2 className="font-medium text-xl">¿Cómo se calcula “Menos competencia”?</h2>
        <p className="mt-2">Estimación simple: premio en USD ÷ (participantes × k + 1). k = 1 si la fuente informa envíos y 0,5 si informa inscriptos, porque los inscriptos suelen ser más que los que realmente entregan. No es una probabilidad de ganar. Las oportunidades sin premio o sin cantidad de participantes van al final, en el grupo “Sin datos de competencia”. Los espacios Destacados no suben en este orden.</p></section>
      <section><h2 className="font-medium text-xl">Elegibilidad</h2><p className="mt-2">La elegibilidad sale de la fuente o de curación humana; nunca la inferimos. Si no está clara, figura como “Elegibilidad sin confirmar”. Los eventos curados (Luma, X) solo se publican después de verificarlos en su página oficial.</p></section>
      <section id="divulgacion" className="rounded-card bg-surface-2 p-5"><h2 className="font-medium text-xl">Divulgación</h2>
        <p className="mt-2">Ulises, creador de Condor Nest, trabaja en belo. belo organiza el hackathon del 28 de octubre en Buenos Aires que listamos. Lo listamos con los mismos criterios que cualquier otro evento y no está pagado como Destacado.</p>
        <p className="mt-2">Los listados de belo no reciben ninguna ventaja en el orden del feed.</p>
        <p className="mt-2">Los espacios “Destacado” son pagos y siempre están marcados. Los links “Afiliado” también: si comprás con ellos, Condor Nest recibe una comisión y no cambia el precio. No aceptamos afiliados de exchanges ni de productos de rendimiento.</p></section>
    </article>
  );
}
