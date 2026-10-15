import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListings } from '@/lib/supabase';
import { HUBS, hubBySlug, hubItems, monthYear, monthDeYear } from '@/lib/hubs';
import { ListingCard } from '@/components/ListingCard';
import { FaqList, faqLd } from '@/components/Faq';
import { ldScript } from '@/lib/jsonld';
import { OG_IMAGE, SITE } from '@/lib/site';
export const revalidate = 3600;
export const dynamicParams = false;
export const generateStaticParams = () => HUBS.map((h) => ({ hub: h.slug }));

type P = { params: Promise<{ hub: string }> };
const masc = (slug: string) => slug === 'bounties' || slug === 'grants';
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const h = hubBySlug((await params).hub);
  if (!h) return {};
  const now = new Date(); const n = hubItems(h, await getListings(), now).length; const m = monthYear(now);
  const title = `${h.h1} (${m}): ${n} ${n === 1 ? 'abiert' + (masc(h.slug) ? 'o' : 'a') : 'abiert' + (masc(h.slug) ? 'os' : 'as')} | Condor Nest`;
  const description = `${n ? `${n} ${n === 1 ? h.noun[0] : h.noun[1]} ${masc(h.slug) ? 'abierto' : 'abierta'}${n === 1 ? '' : 's'} ${h.where}` : `${h.noun[1]} ${h.where}`}, con premio, elegibilidad y fecha de cierre en tu hora. Actualizado todos los días, en español.`;
  return { title: { absolute: title }, description, alternates: { canonical: `/${h.slug}` }, openGraph: { images: [OG_IMAGE], title, description, url: `/${h.slug}`, siteName: 'Condor Nest', locale: 'es_AR', type: 'website' } };
}

export default async function HubPage({ params }: P) {
  const h = hubBySlug((await params).hub);
  if (!h) notFound();
  const now = new Date(); const nowIso = now.toISOString();
  const items = hubItems(h, await getListings(), now);
  const n = items.length; const m = monthYear(now); const ab = masc(h.slug) ? 'abiertos' : 'abiertas';
  const faqs = h.faqs(n);
  const url = `${SITE}/${h.slug}`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': url, url, name: `${h.h1} (${m})`, inLanguage: 'es-AR', isPartOf: { '@id': `${SITE}/#website` } },
    { '@type': 'ItemList', name: `${h.h1} (${m})`, numberOfItems: n, itemListElement: items.map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/o/${l.slug}`, name: l.title })) },
    faqLd(faqs),
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Condor Nest', item: SITE }, { '@type': 'ListItem', position: 2, name: h.label, item: url }] },
  ] };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(ld)} />
      <nav aria-label="Migas de pan" className="pt-3 text-sm text-fg-muted"><ol className="flex min-h-tap items-center gap-1.5"><li><Link href="/" className="hover:text-lime">Condor Nest</Link></li><li aria-hidden="true">›</li><li aria-current="page">{h.label}</li></ol></nav>
      <header className="mt-2 max-w-3xl">
        <h1 className="font-display text-[26px] font-semibold leading-8 lg:text-[40px] lg:leading-[46px]"><span className="text-gradient">{h.h1}</span> <span className="text-fg-muted">({m})</span></h1>
        <div className="mt-4 rounded-card border border-border bg-surface p-4 text-[15px] leading-relaxed">
          {n ? (
            <p>{n === 1 ? 'Esta es' : 'Estas son'} <strong>{n === 1 ? (masc(h.slug) ? 'el' : 'la') : (masc(h.slug) ? 'los' : 'las')} {n} {n === 1 ? h.noun[0] : h.noun[1]} {n === 1 ? ab.slice(0, -1) : ab}</strong> {h.where} en {monthDeYear(now)}: {list(items.map((l) => l.title))}. Están ordenad{masc(h.slug) ? 'os' : 'as'} por fecha de cierre, con premio, quién puede participar y link oficial en cada una.</p>
          ) : (
            <p>En {monthDeYear(now)} no hay {h.noun[1]} {ab} {h.where} por ahora. La lista se actualiza todos los días a la mañana; mientras tanto, <Link href="/" className="text-lime hover:underline">mirá todas las oportunidades abiertas</Link>.</p>
          )}
        </div>
      </header>
      {n > 0 && (
        <section aria-label={h.label} className="mt-8">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((l) => <li key={l.id}><ListingCard listing={l} now={nowIso} /></li>)}</ul>
        </section>
      )}
      <p className="mt-6"><Link href={h.feed} className="inline-flex min-h-tap items-center rounded-pill border border-lime/60 px-4 text-sm text-lime hover:shadow-glow-lime">Ver en el feed completo con filtros →</Link></p>
      <section aria-labelledby="faq" className="mt-12 max-w-3xl">
        <h2 id="faq" className="mb-4 font-display text-2xl font-semibold">Preguntas frecuentes</h2>
        <FaqList items={faqs} />
      </section>
      <nav aria-label="Explorar" className="mt-12 text-sm text-fg-muted">
        <p className="font-mono text-[11px] uppercase tracking-[.12em] text-cyan">Explorar</p>
        <ul className="mt-2 flex flex-wrap gap-2">{HUBS.filter((x) => x.slug !== h.slug).map((x) => <li key={x.slug}><Link href={`/${x.slug}`} className="inline-flex min-h-tap items-center rounded-pill border border-border px-3 hover:border-lime/60 hover:text-fg">{x.label}</Link></li>)}</ul>
      </nav>
    </>
  );
}
