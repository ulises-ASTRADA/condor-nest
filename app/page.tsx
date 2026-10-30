import type { Metadata } from 'next';
import { OG_BASE, OG_IMAGE, SITE, TWITTER_BASE } from '@/lib/site';
import { getListings, lastIngest } from '@/lib/supabase';
import { locationContext, filtersFromSearch, matches } from '@/lib/rank';
import { Feed } from '@/components/Feed';
import { ListingCard } from '@/components/ListingCard';
import Link from 'next/link';
import { Affiliate } from '@/components/Affiliate';
import { affiliateUrl } from '@/components/Affiliate';
import { UpdatedStamp } from '@/components/UpdatedStamp';
import { isOpen, sortListings } from '@/lib/rank';
import { ORG, WEBSITE, ldScript } from '@/lib/jsonld';
import { featuredListings, isFeatured } from '@/lib/featured';
import { feedSeo } from '@/lib/seo';

const TITLE = 'Condor Nest · Hackathons, bounties y grants para builders de LatAm';
const DESCRIPTION = 'Hackathons, bounties y grants abiertos a Argentina y LatAm, en español y actualizados todos los días. Deadlines en tu hora local.';
type Search = Promise<Record<string, string | string[] | undefined>>;
export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const seo = feedSeo(await searchParams);
  return {
    title: { absolute: TITLE }, description: DESCRIPTION,
    ...(seo.canonical ? { alternates: { canonical: seo.canonical } } : {}),
    ...(seo.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: { ...OG_BASE, images: [OG_IMAGE], title: TITLE, description: DESCRIPTION, url: seo.canonical ?? '/' },
    twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG_IMAGE], ...TWITTER_BASE },
  };
}
export const revalidate = 300;

export default async function Home({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const [listings, ingested] = await Promise.all([getListings(), lastIngest()]);
  // Real latest data change: newest listing update, or the last ingest run if more recent.
  const updated = [ingested, ...listings.map((l) => l.updatedAt)].filter(Boolean).sort().pop() ?? null;
  const now = new Date();
  const { f, sort } = filtersFromSearch(sp, locationContext(listings)); // invalid ?pais= / ?ciudad= are dropped here
  const renderedListings = f.showClosed ? listings : listings.filter((l) => isOpen(l, now));
  const open = renderedListings.filter((l) => isOpen(l, now)).length;
  // ItemList = exactly the cards visible on first paint (same filters/sort as the feed island).
  const openList = [...featuredListings(renderedListings.filter((l) => matches(l, f, now))), ...sortListings(renderedListings.filter((l) => !isFeatured(l) && matches(l, f, now)), sort, now).slice(0, 20)];
  const ld = { '@context': 'https://schema.org', '@graph': [{ ...WEBSITE, ...(updated ? { dateModified: updated } : {}) }, ORG,
    { '@type': 'CollectionPage', '@id': `${SITE}/`, url: `${SITE}/`, name: 'Oportunidades para builders de LatAm', inLanguage: 'es-AR', isPartOf: { '@id': `${SITE}/#website` }, ...(updated ? { dateModified: updated } : {}) }, {
    '@type': 'ItemList', name: 'Oportunidades abiertas para builders de LatAm', numberOfItems: openList.length,
    itemListElement: openList.map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/o/${l.slug}`, name: l.title })),
  }] };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(ld)} />
      <Feed listings={renderedListings}
        featuredCards={featuredListings(renderedListings).map((l) => (
          <div key={l.id} data-id={l.id} className="mt-4 hidden">
            <ListingCard listing={l} variant="featured" now={now.toISOString()} />
            
          </div>
        ))}
        cards={<>
          <li data-id="unconf" role="presentation" className="col-span-full hidden border-t border-border pt-4"><aside role="note" aria-label="Elegibilidad sin confirmar"><h3 className="font-mono text-xs uppercase tracking-[.08em] text-fg-muted">Elegibilidad sin confirmar</h3><p className="mt-0.5 text-sm text-fg-muted">Revisá en la fuente si podés participar desde tu país.</p></aside></li>
          <li data-id="dataless" role="presentation" className="col-span-full pt-2 text-xs text-fg-muted"><p role="note"><strong>Sin datos de competencia.</strong> Estas convocatorias no publican la cantidad de participantes y no se pueden comparar.</p></li>
          <li data-id="af" role="presentation" className="col-span-full"><Affiliate url={affiliateUrl()} /></li>
          {renderedListings.filter((l) => !isFeatured(l)).map((l) => <li key={l.id} data-id={l.id} className="flex-col"><ListingCard listing={l} now={now.toISOString()} /></li>)}
        </>} now={now.toISOString()} initial={{ f, sort }} affUrl={affiliateUrl()} hero={<>
        <h1 className="font-display text-[26px] font-semibold leading-8 tracking-[-.01em] lg:text-[44px] lg:font-extrabold lg:leading-[48px]"><span className="text-gradient">Oportunidades</span> para builders de LatAm</h1>
        <UpdatedStamp iso={updated} open={open} counts={{ conf: 0, unc: 0 }} now={now.toISOString()} />
        <Link href="/que-es-una-hackaton" prefetch={false} className="mt-3 inline-flex min-h-tap items-center gap-2 rounded-card border border-border bg-surface px-3 py-2 text-sm text-cyan hover:border-cyan/50">
          ¿Primera vez? Qué es una hackatón y en qué se diferencia de bounties y grants →
        </Link>
      </>} />
    </>
  );
}
