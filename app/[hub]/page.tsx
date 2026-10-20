import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListings, lastIngest } from '@/lib/supabase';
const ddmmyyyy = (iso: string) => new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Cordoba', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
import { HUBS, hubBySlug, hubItems, hubUnconfirmed, hubRestricted, countryFeedCount, hubRegional, hubHeading, monthYear, monthDeYear, hubOrder, answerParts, cityGroups, studentOnly, shortName, refDetails, startDm, venueLine, venueLines } from '@/lib/hubs';
import type { Listing } from '@/lib/types';
import { ListingCard } from '@/components/ListingCard';
import { FaqList, faqLd } from '@/components/Faq';
import { hubEventLd, ldScript } from '@/lib/jsonld';
import { OG_IMAGE, SITE } from '@/lib/site';
export const revalidate = 3600;
export const dynamicParams = false;
export const generateStaticParams = () => HUBS.map((h) => ({ hub: h.slug }));

type P = { params: Promise<{ hub: string }> };
// hackathon, bounty and grant are all masculine in our copy: 'abiertos'.

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const h = hubBySlug((await params).hub);
  if (!h) return {};
  const now = new Date(); const all = await getListings(); const n = hubItems(h, all, now).length; const m = monthYear(now);
  const { title } = hubHeading(h, n, hubRegional(h, all, now).length, m);
  const description = `${n ? `${n} ${n === 1 ? h.noun[0] : h.noun[1]} abierto${n === 1 ? '' : 's'} ${h.where}` : `${h.noun[1]} ${h.where}`}, con premio, elegibilidad y fecha de ${hubOrder(h)} en tu hora. Actualizado todos los días, en español.`;
  return { title: { absolute: title }, description, alternates: { canonical: `/${h.slug}` }, openGraph: { images: [OG_IMAGE], title, description, url: `/${h.slug}`, siteName: 'Condor Nest', locale: 'es_AR', type: 'website' } };
}

export default async function HubPage({ params }: P) {
  const h = hubBySlug((await params).hub);
  if (!h) notFound();
  const now = new Date(); const nowIso = now.toISOString();
  const all = await getListings();
  const items = hubItems(h, all, now); const unconf = hubUnconfirmed(h, all, now); const restr = hubRestricted(h, all, now);
  const feedN = h.iso ? countryFeedCount(h.iso, all, now) : null;
  // Country hub with no country-specific open hackathons: show the ones the feed shows for this country (open to all LatAm or online), clearly labelled.
  const regional = hubRegional(h, all, now);
  const n = items.length; const m = monthYear(now); const heading = hubHeading(h, n, regional.length, m);
  const updated = [await lastIngest(), ...items.map((l) => l.updatedAt)].filter(Boolean).sort().pop() ?? null; const ab = 'abiertos';
  const faqs = h.faqs(n, items, now, all); const order = hubOrder(h);
  const online = h.iso ? hubBySlug('hackathons-online') : null; const onlineN = online ? hubItems(online, all, now).length : 0;
  const cities = h.iso ? cityGroups(h, items) : []; const country = h.where.replace(/^en /, '');
  const stOnly = h.iso ? items.filter(studentOnly) : [];
  const ans = answerParts(h, items, now);
  const url = `${SITE}/${h.slug}`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': url, url, name: `${heading.h1} (${m})`, inLanguage: 'es-AR', isPartOf: { '@id': `${SITE}/#website` }, ...(updated ? { dateModified: updated } : {}) },
    { '@type': 'ItemList', name: `${heading.h1} (${m})`, description: `Ordenados por fecha de ${order}.`, itemListOrder: 'https://schema.org/ItemListOrderAscending', numberOfItems: n + unconf.length, itemListElement: [...items, ...unconf].map((l, i) => { const ev = hubEventLd(l); return { '@type': 'ListItem', position: i + 1, url: `${SITE}/o/${l.slug}`, name: l.title, ...(ev ? { item: ev } : {}) }; }) },
    faqLd(faqs),
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Condor Nest', item: SITE }, { '@type': 'ListItem', position: 2, name: h.label, item: url }] },
  ] };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(ld)} />
      <nav aria-label="Migas de pan" className="pt-3 text-sm text-fg-muted"><ol className="flex min-h-tap items-center gap-1.5"><li><Link prefetch={false} href="/" className="hover:text-lime">Condor Nest</Link></li><li aria-hidden="true">›</li><li aria-current="page">{h.label}</li></ol></nav>
      <header className="mt-2 max-w-3xl">
        <h1 className="font-display text-[26px] font-semibold leading-8 lg:text-[40px] lg:leading-[46px]"><span className="text-gradient">{heading.h1}</span> <span className="text-fg-muted">({m})</span></h1>
        <div className="mt-4 rounded-card border border-border bg-surface p-4 text-[15px] leading-relaxed">
          {n ? (<>
            {h.iso ? <p>{ans.lead}{ans.named.map((l, i) => <span key={l.id}>{i > 0 && (i === ans.named.length - 1 && !ans.more ? ' y ' : ', ')}<Link prefetch={false} href={`/o/${l.slug}`} className="text-lime hover:underline">{shortName(l)}</Link>{refDetails(l)}</span>)}{ans.more > 0 && <> y {ans.more} más</>}.</p> : <p>{n === 1
              ? <>Este es el único <strong>{h.noun[0]} abierto</strong> {h.where} en {monthDeYear(now)}: {items[0].title}.</>
              : <>Estos son <strong>los {n} {h.noun[1]} {ab}</strong> {h.where} en {monthDeYear(now)}.</>}</p>}
            <p className="mt-1 text-sm text-fg-muted">{h.iso ? 'Cada uno tiene' : `Ordenados por fecha de ${order}, con`} premio, quién puede participar y link oficial{h.iso ? '' : ' en cada uno'}.{updated && <> Actualizado el <time dateTime={updated}>{ddmmyyyy(updated)}</time>.</>}</p>
            {(unconf.length > 0 || restr.length > 0 || (feedN != null && feedN !== n)) && <p className="mt-1 text-sm text-fg-muted">
              {unconf.length > 0 && <>Más abajo, {unconf.length} más con elegibilidad sin confirmar. </>}
              {restr.length > 0 && <>No contamos {restr.length} {restr.length === 1 ? 'restringido' : 'restringidos'} a otro país. </>}
              {h.iso && feedN != null && feedN !== n && <>Contando bounties, grants y convocatorias abiertas a toda LatAm, hay <Link prefetch={false} href={`/?pais=${h.iso.toLowerCase()}`} className="text-lime hover:underline">{feedN} oportunidades para {h.where.replace(/^en /, '')}</Link>.</>}
            </p>}
          </>          ) : (
            h.iso ? (<>
              <p>Hoy no hay hackathons abiertos específicos de {country} (que se hagan en {country} o sean solo para participantes de {country}).{regional.length > 0
                ? <> {regional.length === 1 ? 'El que mostramos abajo está abierto' : `Los ${regional.length} que mostramos abajo están abiertos`} a toda LatAm o {regional.length === 1 ? 'es online' : 'son online'}, así que {regional.length === 1 ? 'podés participar' : 'podés participar en ellos'} desde {country}.</>
                : <> Mientras tanto, <Link prefetch={false} href="/" className="text-lime hover:underline">mirá todas las oportunidades abiertas</Link>.</>}</p>
              <p className="mt-1 text-sm text-fg-muted">La lista se actualiza todos los días a la mañana: cuando haya uno en {country}, aparece acá primero.</p>
            </>) : (
              <p>Hoy no hay {h.noun[1]} {ab} {h.where}. La lista se actualiza todos los días a la mañana; mientras tanto, <Link prefetch={false} href="/" className="text-lime hover:underline">mirá todas las oportunidades abiertas</Link>.</p>
            )
          )}
        </div>
      </header>
      {n > 0 && (
        <section aria-label={h.iso ? undefined : h.label} aria-labelledby={h.iso ? 'proximos' : undefined} className="mt-8">
          {h.iso && <><h2 id="proximos" className="font-display text-2xl font-semibold">Próximos hackathons {h.where}</h2><p className="mb-4 mt-1 text-sm text-fg-muted">Ordenados por fecha de inicio.</p></>}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((l) => <li key={l.id}><ListingCard listing={l} now={nowIso} showStart={order === 'inicio'} /></li>)}</ul>
        </section>
      )}
      {regional.length > 0 && (
        <section aria-labelledby="regionales" className="mt-8">
          <h2 id="regionales" className="font-display text-2xl font-semibold">Abiertos a toda LatAm u online</h2>
          <p className="mb-4 mt-1 text-sm text-fg-muted">No son específicos de {country}: se hacen online o aceptan participantes de toda Latinoamérica.</p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{regional.map((l) => <li key={l.id}><ListingCard listing={l} now={nowIso} /></li>)}</ul>
        </section>
      )}
      {unconf.length > 0 && (
        <section aria-labelledby="sinconf" className="mt-8">
          <h2 id="sinconf" className="font-mono text-xs uppercase tracking-[.08em] text-fg-muted">Elegibilidad sin confirmar</h2>
          <p className="mt-1 text-sm text-fg-muted">Revisá en la fuente si podés participar desde tu país.</p>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{unconf.map((l) => <li key={l.id}><ListingCard listing={l} now={nowIso} showStart={order === 'inicio'} /></li>)}</ul>
        </section>
      )}
      {h.iso && (
        <div className="mt-12 max-w-3xl space-y-10">
          {cities.map((g) => (
            <section key={g.city} aria-labelledby={`c-${g.city}`}>
              <h2 id={`c-${g.city}`} className="font-display text-2xl font-semibold">Hackathons en {g.city}</h2>
              {g.items.length === 1 ? (
                <p className="mt-2 text-fg-muted">1 abierto: <Link prefetch={false} href={`/o/${g.items[0].slug}`} className="text-lime hover:underline">{shortName(g.items[0])}</Link>{startDm(g.items[0]) && <> el {startDm(g.items[0])}</>}.{venueLine(g.items[0]) && <span className="block text-sm">{venueLine(g.items[0])}</span>}</p>
              ) : g.items.length ? (<>
                <p className="mt-2 text-fg-muted">{g.items.length} abiertos, el próximo es {shortName(g.items[0])}{startDm(g.items[0]) && <> el {startDm(g.items[0])}</>}.</p>
                <RefList items={g.items} city={false} />
              </>) : (
                <p className="mt-2 text-fg-muted">Hoy no hay hackathons abiertos en {g.city}. Los sumamos apenas se publican, después de verificarlos en su página oficial. ¿Organizás una hackatón en {g.city}? <Link prefetch={false} href="/publicar" className="text-lime hover:underline">Publicala gratis</Link>. Para enterarte cuando aparezcan, sumate al <a href="#nl-mini-t" className="underline decoration-border underline-offset-2 hover:text-fg lg:hidden">newsletter de los lunes</a><Link prefetch={false} href="/#nl-compact-t" className="hidden underline decoration-border underline-offset-2 hover:text-fg lg:inline">newsletter de los lunes</Link>.</p>
              )}
            </section>
          ))}
          {n > 0 && ( /* hidden when the country has no specific open hackathons: "ninguno de los abiertos en X" would contradict the intro */
          <section aria-labelledby="estudiantes">
            <h2 id="estudiantes" className="font-display text-2xl font-semibold">Hackathons para estudiantes</h2>
            {stOnly.length > 0 ? (<><p className="mt-2 text-fg-muted">Solo para estudiantes:</p><RefList items={stOnly} /></>) : <p className="mt-2 text-fg-muted">Hoy ninguno de los abiertos {h.where} es solo para estudiantes.</p>}
            <p className="mt-3 text-fg-muted">Otros también los aceptan, fijate quién puede participar en cada tarjeta.</p>
          </section>
          )}
          {online && (
            <section aria-labelledby="online">
              <h2 id="online" className="font-display text-2xl font-semibold">Hackathons online desde {country}</h2>
              <p className="mt-2 text-fg-muted">Para participar sin viajar: <Link prefetch={false} href={`/${online.slug}`} className="text-lime hover:underline">hackathons online para LatAm</Link> ({onlineN === 1 ? '1 abierto' : `${onlineN} abiertos`} hoy), incluidas convocatorias globales abiertas a Latinoamérica.</p>
            </section>
          )}
        </div>
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

function RefList({ items, city = true }: { items: Listing[]; city?: boolean }) {
  const vs = venueLines(items);
  return <ul className="mt-2 list-disc space-y-2 pl-5">{items.map((l, i) => { const v = vs[i]; return <li key={l.id}><Link prefetch={false} href={`/o/${l.slug}`} className="text-lime hover:underline">{shortName(l)}</Link><span className="text-fg-muted">{refDetails(l, { city })}</span>{v && <span className="block text-sm text-fg-muted">{v}</span>}</li>; })}</ul>;
}
