import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListings, lastIngest } from '@/lib/supabase';
const ddmmyyyy = (iso: string) => new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Cordoba', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
import { HUBS, hubBySlug, hubItems, hubUnconfirmed, hubRestricted, countryFeedCount, monthYear, monthDeYear } from '@/lib/hubs';
import { ListingCard } from '@/components/ListingCard';
import { FaqList, faqLd } from '@/components/Faq';
import { ldScript } from '@/lib/jsonld';
import { OG_IMAGE, SITE } from '@/lib/site';
export const revalidate = 3600;
export const dynamicParams = false;
export const generateStaticParams = () => HUBS.map((h) => ({ hub: h.slug }));

type P = { params: Promise<{ hub: string }> };
const masc = (slug: string) => slug === 'bounties' || slug === 'grants';

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
  const all = await getListings();
  const items = hubItems(h, all, now); const unconf = hubUnconfirmed(h, all, now); const restr = hubRestricted(h, all, now);
  const feedN = h.iso ? countryFeedCount(h.iso, all, now) : null;
  const n = items.length; const m = monthYear(now);
  const updated = [await lastIngest(), ...items.map((l) => l.updatedAt)].filter(Boolean).sort().pop() ?? null; const ab = masc(h.slug) ? 'abiertos' : 'abiertas';
  const faqs = h.faqs(n);
  const url = `${SITE}/${h.slug}`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': url, url, name: `${h.h1} (${m})`, inLanguage: 'es-AR', isPartOf: { '@id': `${SITE}/#website` }, ...(updated ? { dateModified: updated } : {}) },
    { '@type': 'ItemList', name: `${h.h1} (${m})`, numberOfItems: n + unconf.length, itemListElement: [...items, ...unconf].map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/o/${l.slug}`, name: l.title })) },
    faqLd(faqs),
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Condor Nest', item: SITE }, { '@type': 'ListItem', position: 2, name: h.label, item: url }] },
  ] };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(ld)} />
      <nav aria-label="Migas de pan" className="pt-3 text-sm text-fg-muted"><ol className="flex min-h-tap items-center gap-1.5"><li><Link prefetch={false} href="/" className="hover:text-lime">Condor Nest</Link></li><li aria-hidden="true">›</li><li aria-current="page">{h.label}</li></ol></nav>
      <header className="mt-2 max-w-3xl">
        <h1 className="font-display text-[26px] font-semibold leading-8 lg:text-[40px] lg:leading-[46px]"><span className="text-gradient">{h.h1}</span> <span className="text-fg-muted">({m})</span></h1>
        <div className="mt-4 rounded-card border border-border bg-surface p-4 text-[15px] leading-relaxed">
          {n ? (<>
            <p>{n === 1
              ? <>{masc(h.slug) ? 'Este es el único' : 'Esta es la única'} <strong>{h.noun[0]} {ab.slice(0, -1)}</strong> {h.where} en {monthDeYear(now)}: {items[0].title}.</>
              : <>{'Estas son'} <strong>{masc(h.slug) ? 'los' : 'las'} {n} {h.noun[1]} {ab}</strong> {h.where} en {monthDeYear(now)}.</>}</p>
            <p className="mt-1 text-sm text-fg-muted">Ordenad{masc(h.slug) ? 'os' : 'as'} por fecha de cierre, con premio, quién puede participar y link oficial en cada {masc(h.slug) ? 'uno' : 'una'}.{updated && <> Actualizado el <time dateTime={updated}>{ddmmyyyy(updated)}</time>.</>}</p>
            {(unconf.length > 0 || restr.length > 0 || (feedN != null && feedN !== n)) && <p className="mt-1 text-sm text-fg-muted">
              {unconf.length > 0 && <>Más abajo, {unconf.length} más con elegibilidad sin confirmar. </>}
              {restr.length > 0 && <>No contamos {restr.length} {restr.length === 1 ? 'restringid' + (masc(h.slug) ? 'o' : 'a') : 'restringid' + (masc(h.slug) ? 'os' : 'as')} a otro país. </>}
              {h.iso && feedN != null && feedN !== n && <>Contando bounties, grants y convocatorias abiertas a toda LatAm, hay <Link prefetch={false} href={`/?pais=${h.iso.toLowerCase()}`} className="text-lime hover:underline">{feedN} oportunidades para {h.where.replace(/^en /, '')}</Link>.</>}
            </p>}
          </>          ) : (
            <p>En {monthDeYear(now)} no hay {h.noun[1]} {ab} {h.where} por ahora. La lista se actualiza todos los días a la mañana; mientras tanto, <Link prefetch={false} href="/" className="text-lime hover:underline">mirá todas las oportunidades abiertas</Link>.</p>
          )}
        </div>
      </header>
      {n > 0 && (
        <section aria-label={h.label} className="mt-8">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((l) => <li key={l.id}><ListingCard listing={l} now={nowIso} /></li>)}</ul>
        </section>
      )}
      {unconf.length > 0 && (
        <section aria-labelledby="sinconf" className="mt-8">
          <h2 id="sinconf" className="font-mono text-xs uppercase tracking-[.08em] text-fg-muted">Elegibilidad sin confirmar</h2>
          <p className="mt-1 text-sm text-fg-muted">Revisá en la fuente si podés participar desde tu país.</p>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{unconf.map((l) => <li key={l.id}><ListingCard listing={l} now={nowIso} /></li>)}</ul>
        </section>
      )}
      <p className="mt-6"><Link prefetch={false} href={h.feed} className="inline-flex min-h-tap items-center rounded-pill border border-lime/60 px-4 text-sm text-lime hover:shadow-glow-lime">Ver en el feed completo con filtros →</Link></p>
      <section aria-labelledby="faq" className="mt-12 max-w-3xl">
        <h2 id="faq" className="mb-4 font-display text-2xl font-semibold">Preguntas frecuentes</h2>
        <FaqList items={faqs} />
      </section>
      <nav aria-label="Explorar" className="mt-12 text-sm text-fg-muted">
        <p className="font-mono text-[11px] uppercase tracking-[.12em] text-cyan">Explorar</p>
        <ul className="mt-2 flex flex-wrap gap-2">{HUBS.filter((x) => x.slug !== h.slug).map((x) => <li key={x.slug}><Link prefetch={false} href={`/${x.slug}`} className="inline-flex min-h-tap items-center rounded-pill border border-border px-3 hover:border-lime/60 hover:text-fg">{x.label}</Link></li>)}</ul>
      </nav>
    </>
  );
}
