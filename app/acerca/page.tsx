import { OG_BASE, OG_IMAGE } from '@/lib/site';
import Link from 'next/link';
import { FaqList, faqLd } from '@/components/Faq';
import { ldScript } from '@/lib/jsonld';
import { HUBS } from '@/lib/hubs';

const FAQS = [
  { q: '¿Qué es Condor Nest?', a: 'Un feed en español que junta los hackathons, bounties y grants abiertos a builders de Argentina y Latinoamérica, con premio, elegibilidad, competencia y fecha de cierre en tu hora local. Está hecho en Córdoba, Argentina.' },
  { q: '¿Cada cuánto se actualiza?', a: 'Todos los días. Una carga automática corre cada mañana (entre las 8 y las 9, hora de Argentina) y trae lo nuevo de Superteam Earn, Devpost y Taikai. Los eventos curados de X y Luma se suman después de verificarlos en su página oficial.' },
  { q: '¿Cómo publico mi evento?', a: 'Completá el formulario de “Publicá tu evento” (/publicar) con el nombre, las fechas y el link oficial. Listamos gratis cualquier hackathon, bounty o grant abierto a builders de LatAm una vez que lo verificamos en su página oficial. También podés pagar un espacio “Destacado”, que siempre va marcado.' },
  { q: '¿Es gratis?', a: 'Sí. Ver el feed, filtrar y suscribirte al newsletter es gratis y no hace falta cuenta. Los espacios “Destacado” son pagos y los links “Afiliado” pueden dejarnos una comisión sin cambiarte el precio; los dos están siempre marcados.' },
  { q: '¿Qué países cubre?', a: 'Toda Latinoamérica: listamos oportunidades que se hacen en LatAm o que están restringidas a LatAm o a un país de LatAm (Argentina, México, Chile, Colombia, Brasil, Perú, Uruguay y el resto de la región). También listamos convocatorias globales abiertas a participantes de Latinoamérica. No listamos las que no aclaran desde dónde se puede participar. El feed arranca filtrado por tu país y con un clic ves todo.' },
  { q: '¿Cómo me suscribo al newsletter?', a: 'Dejá tu mail en el formulario del newsletter (al costado del feed en la home, o al pie de la página en el celular) y confirmá desde el correo que te llega (si no lo ves, revisá spam). Es un mail por semana, los lunes, con lo que cierra pronto y lo que tiene poca competencia. Te podés dar de baja con un clic.' },
];
export const metadata = { title: 'Acerca', description: 'Qué es Condor Nest, cómo elegimos las oportunidades, cada cuánto se actualiza y cómo publicar tu hackathon. Hecho en Córdoba.', alternates: { canonical: '/acerca' }, openGraph: { ...OG_BASE, images: [OG_IMAGE], url: '/acerca', description: 'Qué es Condor Nest, cómo elegimos las oportunidades, cada cuánto se actualiza y cómo publicar tu hackathon. Hecho en Córdoba.' } };

const H2 = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <p className="font-mono text-[11px] uppercase tracking-[.12em] text-cyan">{k}</p>
    <h2 className="mt-1 font-display text-2xl font-semibold lg:text-3xl">{children}</h2>
  </div>
);
function Tile({ icon, title, children, tone = 'lime' }: { icon: string; title: string; children: React.ReactNode; tone?: 'lime' | 'cyan' | 'violet' }) {
  const t = tone === 'cyan' ? 'text-cyan border-cyan/40' : tone === 'violet' ? 'text-violet border-violet/40' : 'text-lime border-lime/40';
  return (
    <div className="card-link group h-full rounded-card">
      <div className="card flex h-full flex-col rounded-card border border-border bg-surface p-5 transition-[transform,border-color] duration-fast ease-out-expo group-hover:border-lime/60">
        <span aria-hidden="true" className={`grid h-10 w-10 place-items-center rounded-[12px] border bg-surface-2 text-lg ${t}`}>{icon}</span>
        <h3 className="mt-4 font-medium">{title}</h3>
        <div className="mt-1.5 text-sm text-fg-muted">{children}</div>
      </div>
    </div>
  );
}

export default function Acerca() {
  return (
    <article className="mx-auto max-w-5xl space-y-16 py-10 lg:space-y-20 lg:py-16">
      {/* 1 · Hero */}
      <header className="relative overflow-hidden rounded-[24px] border border-border bg-surface/60 px-6 py-14 text-center lg:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] max-w-full -translate-x-1/2 -translate-y-1/3 rounded-full bg-lime/20 blur-3xl motion-safe:animate-pulse-glow" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-0 h-56 w-72 rounded-full bg-violet/20 blur-3xl" />
        <p className="relative font-mono text-xs uppercase tracking-[.16em] text-fg-muted">Acerca de</p>
        <h1 className="relative mt-3 font-display text-4xl font-extrabold tracking-[-.01em] lg:text-6xl"><span className="text-fg">CONDOR</span> <span className="text-gradient">NEST</span></h1>
        <p className="relative mx-auto mt-4 max-w-xl text-lg text-fg-muted">Hackathons, bounties y grants para builders de LatAm, en un solo feed en español.</p>
      </header>

      {/* 2 · Qué es */}
      <section aria-labelledby="que-es">
        <H2 k="01 · Qué es"><span id="que-es">Un feed, toda LatAm</span></H2>
        <p className="max-w-3xl text-lg leading-relaxed">Condor Nest junta hackathons, bounties y grants abiertos a builders de Argentina y LatAm en un solo feed en español, actualizado todos los días. Los horarios se muestran en la zona horaria de tu dispositivo.</p>
      </section>

      {/* 3 · Cómo funciona */}
      <section aria-labelledby="como">
        <H2 k="02 · Cómo funciona"><span id="como">De la fuente a tu feed</span></H2>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            { i: '📡', t: 'Fuentes', d: 'Todos los días leemos Superteam Earn, Devpost y Taikai, y rastreamos X y Luma buscando eventos nuevos.', tone: 'cyan' as const },
            { i: '🔎', t: 'Verificación en página oficial', d: 'Cada evento curado se publica solo después de verificarlo en su página oficial: fecha, lugar, premios y quién puede participar.', tone: 'violet' as const },
            { i: '⚡', t: 'Feed', d: 'Queda en el feed con su fuente citada, ordenado por cierre o por menos competencia.', tone: 'lime' as const },
          ].map((s, n) => (
            <li key={s.t} className="relative">
              <Tile icon={s.i} title={`${n + 1}. ${s.t}`} tone={s.tone}>{s.d}</Tile>
              {n < 2 && <span aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 font-mono text-lime md:block">→</span>}
            </li>
          ))}
        </ol>
      </section>

      {/* 4 · Fuentes */}
      <section aria-labelledby="fuentes">
        <H2 k="03 · Fuentes"><span id="fuentes">De dónde salen las oportunidades</span></H2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Tile icon="◎" title="Superteam Earn" tone="lime">Bounties y proyectos del ecosistema Solana, con su región de elegibilidad.</Tile>
          <Tile icon="⌘" title="Devpost" tone="cyan">Hackathons presenciales que se hacen en LatAm.</Tile>
          <Tile icon="◆" title="Taikai" tone="violet">Challenges que nombran un lugar de LatAm.</Tile>
          <Tile icon="𝕏" title="Curados de X" tone="lime">Eventos encontrados en X y Luma, verificados en su página oficial y con el post citado.</Tile>
        </div>
      </section>

      {/* 5 · Features */}
      <section aria-labelledby="features">
        <H2 k="04 · Features"><span id="features">Hecho para encontrar rápido</span></H2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile icon="📍" title="Filtro por país" tone="cyan">Arranca en tu país, junto con lo abierto a toda LatAm. Un clic y ves todo.</Tile>
          <Tile icon="⇅" title="Menos competencia" tone="lime">Ordená por premio por participante. <a href="#ranking" className="text-cyan underline-offset-4 hover:underline">Cómo se calcula ↓</a></Tile>
          <Tile icon="⏰" title="Horarios locales" tone="violet">Deadlines y cuentas regresivas en tu zona horaria.</Tile>
          <Tile icon="♫" title="Música lo-fi" tone="cyan">Un tema original de fondo, con fade-in y fade-out. <a href="#musica" className="text-cyan underline-offset-4 hover:underline">Créditos ↓</a></Tile>
        </div>
      </section>

      {/* Reglas (existing factual copy) */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div id="ranking" className="scroll-mt-24 rounded-card border border-border bg-surface p-6">
          <h2 className="font-display text-xl font-semibold">¿Cómo se calcula “Menos competencia”?</h2>
          <p className="mt-3 text-fg-muted">Estimación simple: <span className="font-mono text-fg">premio en USD ÷ (participantes × k + 1)</span>. k = 1 si la fuente informa envíos y 0,5 si informa inscriptos, porque los inscriptos suelen ser más que los que realmente entregan. No es una probabilidad de ganar. Las oportunidades sin premio o sin cantidad de participantes van al final, en el grupo “Sin datos de competencia”. Los espacios Destacados no suben en este orden.</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-6">
          <h2 className="font-display text-xl font-semibold">Qué listamos</h2>
          <p className="mt-3 text-fg-muted">Listamos oportunidades que se hacen en LatAm o que están restringidas explícitamente a LatAm o a un país de LatAm. También listamos convocatorias globales abiertas a participantes de Latinoamérica. No listamos las que no aclaran desde dónde se puede participar. La elegibilidad sale de la fuente o de curación humana; nunca la inferimos. Si un evento presencial en LatAm no aclara quién puede participar, figura como “Elegibilidad sin confirmar”. Los eventos curados (Luma, X) solo se publican después de verificarlos en su página oficial.</p>
        </div>
      </section>

      {/* 6 · Transparencia */}
      <section id="divulgacion" className="scroll-mt-24 rounded-[20px] p-[1px]" style={{ background: 'linear-gradient(120deg, rgb(var(--lime) / .6), rgb(var(--cyan) / .4), rgb(var(--violet) / .6))' }}>
        <div className="rounded-[19px] bg-surface p-6 lg:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[.12em] text-cyan">05 · Transparencia</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Transparencia</h2>
          <p className="mt-3 max-w-3xl">Los espacios <span className="rounded-pill bg-magenta px-2 py-0.5 font-mono text-xs uppercase text-[#07080B]">Destacado</span> son pagos y siempre están marcados. Los links <span className="rounded-pill border border-border px-2 py-0.5 font-mono text-xs uppercase">Afiliado</span> también: si comprás con ellos, Condor Nest recibe una comisión y no cambia el precio. No aceptamos afiliados de exchanges ni de productos de rendimiento.</p>
        </div>
      </section>

      {/* 7 · Créditos */}
      <section id="musica" className="scroll-mt-24 grid gap-4 sm:grid-cols-2">
        <Tile icon="🏔" title="Hecho en Córdoba" tone="lime">Para builders de toda LatAm.</Tile>
        <Tile icon="♫" title="Música" tone="violet">Lo-fi original de Lo-Fi Mate, hecho para Condor Nest. La podés apagar desde el botón del ecualizador arriba.</Tile>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-t" className="scroll-mt-24">
        <script type="application/ld+json" dangerouslySetInnerHTML={ldScript({ '@context': 'https://schema.org', ...faqLd(FAQS) })} />
        <H2 k="06 · Preguntas frecuentes"><span id="faq-t">Preguntas frecuentes</span></H2>
        <FaqList items={FAQS} />
        <p className="mt-4 text-sm text-fg-muted">Explorá por país o tema: {HUBS.map((h, i) => <span key={h.slug}>{i ? ' · ' : ''}<Link href={`/${h.slug}`} className="text-lime hover:underline">{h.label}</Link></span>)}</p>
      </section>

      {/* 8 · CTA */}
      <section className="text-center">
        <Link href="/" className="btn-sweep inline-flex min-h-tap items-center gap-2 rounded-pill bg-lime px-7 py-3 font-medium text-primary-fg shadow-glow-lime transition-transform duration-fast hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bg">Ver oportunidades abiertas →</Link>
      </section>
    </article>
  );
}
