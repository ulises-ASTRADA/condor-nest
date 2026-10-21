import type { Metadata } from 'next';
import Link from 'next/link';
import { FaqList } from '@/components/Faq';
import { ORG, WEBSITE, ldScript } from '@/lib/jsonld';
import { OG_BASE, OG_IMAGE, SITE } from '@/lib/site';

const PATH = '/que-es-una-hackaton';
const TITLE = 'Qué es una hackatón: diferencias con bounties y grants';
const DESCRIPTION = 'Qué es una hackatón, qué se entrega en una bounty y para qué sirve un grant. Comparación, ejemplos y cómo elegir tu primera oportunidad en LatAm.';
const UPDATED = '2026-10-21';
const URL = `${SITE}${PATH}`;
const SOURCES = [
  { name: 'Major League Hacking: qué es una hackatón', url: 'https://guide.mlh.com/overview/why-organize-a-hackathon', note: 'Aprendizaje, colaboración y creación de proyectos.' },
  { name: 'Superteam Earn: tipos de convocatorias', url: 'https://docs.superteam.fun/the-superteam-handbook/community/faqs/superteam-earn-faq', note: 'Cómo distingue una bounty competitiva de un proyecto freelance.' },
  { name: 'Ethereum.org: programas de grants', url: 'https://ethereum.org/community/grants/', note: 'Ejemplos de financiamiento para proyectos y comunidades.' },
];
const FAQS = [
  { q: '¿Qué significa hackatón o hackathon?', a: 'Es un encuentro con tiempo definido para crear y presentar un proyecto. Habitualmente combina trabajo en equipo, aprendizaje y una demostración final. Hackatón y hackathon se usan para referirse al mismo formato.' },
  { q: '¿Hay que saber programar para participar en una hackatón?', a: 'No necesariamente. Hay eventos que aceptan perfiles de diseño, producto, comunicación o negocios, además de desarrollo. Otros exigen habilidades concretas. Revisá los requisitos publicados por cada organización.' },
  { q: '¿Qué diferencia hay entre una hackatón y una bounty?', a: 'Una hackatón organiza la creación de un proyecto dentro de un evento. Una bounty parte de una tarea o desafío ya definido y recompensa las entregas seleccionadas según sus bases. Ninguno de los dos formatos garantiza un premio por participar.' },
  { q: '¿Una bounty es un trabajo freelance?', a: 'No necesariamente. En una bounty competitiva varias personas pueden realizar el trabajo y solo algunas recibir un premio. En un proyecto freelance suele seleccionarse a quien hará el trabajo antes de empezarlo. Confirmá el mecanismo en las bases.' },
  { q: '¿Qué diferencia hay entre un grant y un premio de hackatón?', a: 'Un premio reconoce un resultado dentro de una competencia. Un grant es apoyo para desarrollar un proyecto alineado con los objetivos de un programa. La postulación, los entregables y las condiciones de desembolso dependen de cada convocatoria.' },
  { q: '¿Puedo participar desde Argentina o Latinoamérica?', a: 'Depende de la elegibilidad: algunas convocatorias son globales, otras aceptan solo ciertos países o requieren presencia física. En Condor Nest podés filtrar por ubicación y modalidad, y revisar la fuente oficial de cada oportunidad.' },
  { q: '¿Se puede empezar una hackatón sin equipo?', a: 'Depende del evento. Antes de inscribirte, comprobá si admite inscripción individual, cómo se forman los equipos y cuántas personas puede tener cada uno. No asumas que todos los organizadores usan el mismo sistema.' },
];
const ROWS = [
  ['Punto de partida', 'Un evento y sus desafíos.', 'Una tarea o un resultado definido.', 'Una propuesta de proyecto alineada con un programa.'],
  ['Qué preparás', 'Un prototipo o proyecto y su presentación, según las bases.', 'La entrega que pide el brief: por ejemplo, código, diseño o contenido.', 'Una postulación con objetivos, alcance y presupuesto, si lo piden.'],
  ['Cómo se elige', 'Puede haber jurado y premios; no todos los eventos son iguales.', 'Por selección de entregas o cumplimiento de criterios, según la convocatoria.', 'Por evaluación de la propuesta y los criterios del programa.'],
  ['Tiempo', 'Tiene fechas de inicio y fin.', 'Tiene un plazo de entrega o las reglas que publique quien la ofrece.', 'Tiene una convocatoria y un plan de ejecución propios.'],
  ['Qué no asumir', 'Que participar garantiza un premio o que aceptan cualquier proyecto previo.', 'Que todas las personas que entregan van a cobrar.', 'Que la aprobación, el monto o el desembolso están garantizados.'],
];
export const metadata: Metadata = {
  title: TITLE, description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { ...OG_BASE, title: TITLE, description: DESCRIPTION, url: PATH, images: [OG_IMAGE], type: 'article', publishedTime: UPDATED, modifiedTime: UPDATED },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
};
const link = 'inline-flex min-h-tap items-center text-lime underline decoration-lime/40 underline-offset-4 hover:decoration-lime';
const heading = 'font-display text-2xl font-semibold tracking-tight lg:text-3xl';

export default function OpportunityGuide() {
  const ld = { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'WebPage', '@id': URL, url: URL, name: TITLE, description: DESCRIPTION, inLanguage: 'es-AR', isPartOf: { '@id': `${SITE}/#website` }, mainEntity: { '@id': `${URL}#article` } },
    { '@type': 'Article', '@id': `${URL}#article`, headline: TITLE, description: DESCRIPTION, inLanguage: 'es-AR', datePublished: UPDATED, dateModified: UPDATED, author: { '@id': `${SITE}/#org` }, publisher: { '@id': `${SITE}/#org` }, mainEntityOfPage: { '@id': URL }, citation: SOURCES.map((s) => s.url) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Condor Nest', item: SITE }, { '@type': 'ListItem', position: 2, name: 'Qué es una hackatón', item: URL }] },
  ] };
  return (
    <article className="mx-auto max-w-5xl py-6 lg:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(ld)} />
      <nav aria-label="Migas de pan" className="mb-6 text-sm text-fg-muted"><ol className="flex flex-wrap items-center gap-2"><li><Link href="/" className="inline-flex min-h-tap items-center hover:text-lime">Condor Nest</Link></li><li aria-hidden="true">/</li><li aria-current="page">Guía para empezar</li></ol></nav>
      <header>
        <p className="font-mono text-xs uppercase tracking-[.12em] text-cyan">Guía para builders de LatAm</p>
        <h1 className="mt-3 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight lg:text-5xl">¿Qué es una <span className="text-gradient">hackatón</span>?</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed">Una <strong>hackatón</strong> (o <strong>hackathon</strong>) es un encuentro con tiempo definido para crear y presentar un proyecto, habitualmente en equipo. Es una oportunidad para aprender, probar una idea y compartir lo construido; puede incluir desafíos, mentorías y premios.</p>
        <p className="mt-3 max-w-3xl leading-relaxed text-fg-muted">La diferencia central: en una hackatón construís dentro de un evento; en una <strong className="text-fg">bounty</strong> respondés a una tarea; con un <strong className="text-fg">grant</strong> buscás apoyo para desarrollar un proyecto.</p>
        <p className="mt-4 text-sm text-fg-muted">Por Condor Nest · Actualizado el <time dateTime={UPDATED}>21 de octubre de 2026</time></p>
      </header>
      <nav aria-label="En esta guía" className="mt-7 rounded-card border border-border bg-surface p-4">
        <p className="font-mono text-xs uppercase tracking-[.1em] text-fg-muted">En esta guía</p>
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">{[['formatos', 'Los tres formatos'], ['comparacion', 'Comparación'], ['elegir', 'Cuál elegir'], ['antes-de-anotarte', 'Antes de anotarte'], ['preguntas', 'Preguntas frecuentes']].map(([id, label]) => <li key={id}><a className={link} href={`#${id}`}>{label}</a></li>)}</ul>
      </nav>

      <section id="formatos" aria-labelledby="formatos-t" className="mt-12 scroll-mt-24">
        <h2 id="formatos-t" className={heading}>Hackatón, bounty y grant: qué es cada uno</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <section aria-labelledby="hackaton-t" className="rounded-card border border-lime/40 bg-surface p-5">
            <p className="font-mono text-xs uppercase text-lime">Crear y aprender</p>
            <h3 id="hackaton-t" className="mt-2 text-xl font-medium">Hackatón</h3>
            <p className="mt-3 leading-relaxed text-fg-muted">El foco es construir algo durante un evento. La entrega puede ser un prototipo, una demo o una presentación, según el reglamento. No necesitás asumir que ya debe ser un producto terminado.</p>
            <p className="mt-3 text-sm leading-relaxed"><strong>Ejemplo ilustrativo:</strong> un equipo arma una demo que ayuda a organizar donaciones y la presenta al final del encuentro.</p>
            <Link href="/?tipo=hackathon" className={`${link} mt-3 text-sm`}>Ver hackathons abiertos →</Link>
          </section>
          <section aria-labelledby="bounty-t" className="rounded-card border border-cyan/40 bg-surface p-5">
            <p className="font-mono text-xs uppercase text-cyan">Resolver una tarea</p>
            <h3 id="bounty-t" className="mt-2 text-xl font-medium">Bounty</h3>
            <p className="mt-3 leading-relaxed text-fg-muted">Es una recompensa asociada a una tarea o desafío concreto. En una bounty competitiva, como las de Superteam Earn, varias personas entregan y se premian las propuestas seleccionadas.</p>
            <p className="mt-3 text-sm leading-relaxed"><strong>Ejemplo ilustrativo:</strong> una organización pide un tutorial y elige las entregas que cumplen mejor sus criterios.</p>
            <Link href="/bounties" className={`${link} mt-3 text-sm`}>Ver bounties abiertos →</Link>
          </section>
          <section aria-labelledby="grant-t" className="rounded-card border border-violet/40 bg-surface p-5">
            <p className="font-mono text-xs uppercase text-violet">Impulsar un proyecto</p>
            <h3 id="grant-t" className="mt-2 text-xl font-medium">Grant</h3>
            <p className="mt-3 leading-relaxed text-fg-muted">Es apoyo o financiamiento para desarrollar un proyecto que encaja con los objetivos de un programa. Puede destinarse a herramientas, investigación o iniciativas de comunidad, entre otros fines.</p>
            <p className="mt-3 text-sm leading-relaxed"><strong>Ejemplo ilustrativo:</strong> un equipo postula una herramienta abierta y explica qué quiere construir y qué recursos necesita.</p>
            <Link href="/grants" className={`${link} mt-3 text-sm`}>Ver grants abiertos →</Link>
          </section>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-fg-muted">Los ejemplos son ficticios y sirven para distinguir los formatos. Las condiciones reales siempre salen de las bases de cada convocatoria.</p>
      </section>

      <section id="comparacion" aria-labelledby="comparacion-t" className="mt-12 scroll-mt-24">
        <h2 id="comparacion-t" className={heading}>Diferencias entre hackathons, bounties y grants</h2>
        <p className="mt-3 text-fg-muted">Compará el tipo de compromiso antes de elegir dónde dedicar tu tiempo.</p>
        <p className="mt-2 text-sm text-fg-muted sm:hidden">Deslizá la tabla hacia los lados para ver los tres formatos.</p>
        <div role="region" aria-label="Comparación de hackatón, bounty y grant" tabIndex={0} className="mt-4 overflow-x-auto rounded-card border border-border bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime">
          <table className="w-full min-w-[680px] text-left text-sm leading-relaxed">
            <caption className="sr-only">Cómo se diferencian una hackatón, una bounty y un grant</caption>
            <thead className="bg-surface-2"><tr>{['Aspecto', 'Hackatón', 'Bounty', 'Grant'].map((h) => <th key={h} scope="col" className="px-4 py-4 font-medium text-lime">{h}</th>)}</tr></thead>
            <tbody>{ROWS.map(([aspect, ...cells]) => <tr key={aspect} className="border-t border-border"><th scope="row" className="px-4 py-4 align-top font-medium">{aspect}</th>{cells.map((cell, i) => <td key={i} className="px-4 py-4 align-top text-fg-muted">{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>

      <section id="elegir" aria-labelledby="elegir-t" className="mt-12 scroll-mt-24">
        <h2 id="elegir-t" className={heading}>¿Cuál te conviene para empezar?</h2>
        <ul className="mt-4 space-y-3 leading-relaxed text-fg-muted">
          <li><strong className="text-fg">Si querés explorar una idea con otras personas:</strong> buscá una hackatón cuyo tema y requisitos encajen con tu experiencia.</li>
          <li><strong className="text-fg">Si preferís un objetivo definido:</strong> mirá bounties y compará el esfuerzo de la entrega con sus criterios de selección.</li>
          <li><strong className="text-fg">Si ya tenés un proyecto que querés impulsar:</strong> buscá grants que apoyen ese tipo de trabajo y prepará una propuesta concreta.</li>
        </ul>
        <p className="mt-4 leading-relaxed text-fg-muted">No hace falta elegir un solo camino: podrías probar una idea en una hackatón y después buscar apoyo para continuarla. Que un programa permita ese recorrido depende de sus reglas sobre proyectos previos y financiamiento.</p>
      </section>

      <section id="antes-de-anotarte" aria-labelledby="antes-t" className="mt-12 scroll-mt-24 rounded-card border border-border bg-surface p-5 lg:p-7">
        <h2 id="antes-t" className={heading}>Antes de anotarte, revisá estas cinco cosas</h2>
        <ol className="mt-5 list-decimal space-y-3 pl-5 leading-relaxed text-fg-muted">
          <li><strong className="text-fg">Elegibilidad:</strong> país, edad, experiencia, idioma y si admite inscripción individual o por equipo.</li>
          <li><strong className="text-fg">Fechas y modalidad:</strong> distinguí el cierre de inscripción del inicio del evento y de la entrega. Comprobá sede, zona horaria y posibilidad de participar online.</li>
          <li><strong className="text-fg">Entrega y evaluación:</strong> qué archivos, demo, repositorio o propuesta piden y con qué criterios se selecciona.</li>
          <li><strong className="text-fg">Premio o apoyo:</strong> monto, moneda, cantidad de beneficiarios y condiciones de pago. Un pozo total no equivale a lo que recibe cada persona.</li>
          <li><strong className="text-fg">Condiciones del trabajo:</strong> costo de participar, reglas sobre código previo e IA, propiedad de lo creado y obligaciones posteriores.</li>
        </ol>
      </section>

      <section id="preguntas" aria-labelledby="preguntas-t" className="mt-12 scroll-mt-24">
        <h2 id="preguntas-t" className={`${heading} mb-5`}>Preguntas frecuentes</h2>
        <FaqList items={FAQS} />
      </section>
      <section aria-labelledby="fuentes-t" className="mt-12 border-t border-border pt-6">
        <h2 id="fuentes-t" className="text-lg font-medium">Fuentes y criterio editorial</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">Síntesis de Condor Nest a partir de documentación de organizadores y plataformas, consultada el 21 de octubre de 2026. Las definiciones orientan; las bases oficiales determinan cómo funciona cada oportunidad.</p>
        <ul className="mt-3 space-y-2 text-sm">{SOURCES.map((s) => <li key={s.url}><a href={s.url} className={link}>{s.name} ↗</a><span className="block text-fg-muted">{s.note}</span></li>)}</ul>
      </section>
      <section aria-labelledby="explorar-t" className="mt-10 rounded-card border border-lime/40 bg-surface p-6">
        <h2 id="explorar-t" className="font-display text-xl font-semibold">Encontrá tu próxima oportunidad</h2>
        <p className="mt-3 leading-relaxed text-fg-muted">Explorá convocatorias para Argentina y Latinoamérica, filtrá por ubicación y modalidad y abrí la fuente oficial antes de postularte.</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2"><Link href="/" className={link}>Ver todas las oportunidades →</Link><Link href="/hackathons-argentina" className={link}>Hackathons en Argentina →</Link><Link href="/hackathons-ia" className={link}>Hackathons de IA →</Link></div>
      </section>
    </article>
  );
}
