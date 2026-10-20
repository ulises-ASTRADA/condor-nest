import { OG_BASE, OG_IMAGE } from '@/lib/site';
import { getListings, lastIngest } from '@/lib/supabase';
import { filtersFromSearch, matches } from '@/lib/rank';
import { Feed } from '@/components/Feed';
import { ListingCard } from '@/components/ListingCard';
import Link from 'next/link';
import { Affiliate } from '@/components/Affiliate';
import { affiliateUrl } from '@/components/Affiliate';
import { UpdatedStamp } from '@/components/UpdatedStamp';
import { isOpen, sortListings } from '@/lib/rank';
import { ORG, WEBSITE, ldScript } from '@/lib/jsonld';
import { SITE } from '@/lib/site';
export const metadata = { alternates: { canonical: '/' }, openGraph: { ...OG_BASE, images: [OG_IMAGE], url: '/' } };
export const revalidate = 300;

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const [listings, ingested] = await Promise.all([getListings(), lastIngest()]);
  // Real latest data change: newest listing update, or the last ingest run if more recent.
  const updated = [ingested, ...listings.map((l) => l.updatedAt)].filter(Boolean).sort().pop() ?? null;
  const now = new Date();
  const { f, sort } = filtersFromSearch(sp);
  const open = listings.filter((l) => isOpen(l, now)).length;
  const vis = listings.filter((l) => matches(l, f, now)); const unc = vis.filter((l) => l.eligibility === 'unknown').length;
  // ItemList = exactly the cards visible on first paint (same filters/sort as the feed island).
  const openList = [...listings.filter((l) => l.featured && matches(l, f, now)).slice(0, 1), ...sortListings(listings.filter((l) => !l.featured && matches(l, f, now)), sort, now).slice(0, 20)];
  const ld = { '@context': 'https://schema.org', '@graph': [{ ...WEBSITE, ...(updated ? { dateModified: updated } : {}) }, ORG,
    { '@type': 'CollectionPage', '@id': `${SITE}/`, url: `${SITE}/`, name: 'Oportunidades para builders LatAm', inLanguage: 'es-AR', isPartOf: { '@id': `${SITE}/#website` }, ...(updated ? { dateModified: updated } : {}) }, {
    '@type': 'ItemList', name: 'Oportunidades abiertas para builders LatAm', numberOfItems: openList.length,
    itemListElement: openList.map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/o/${l.slug}`, name: l.title })),
  }] };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(ld)} />
      <Feed listings={listings}
        featuredCards={listings.filter((l) => l.featured).map((l) => (
          <div key={l.id} data-id={l.id} className="mt-4 hidden">
            <ListingCard listing={l} variant="featured" now={now.toISOString()} />
            
          </div>
        ))}
        cards={<>
          <li data-id="unconf" className="col-span-full hidden border-t border-border pt-4"><h3 className="font-mono text-xs uppercase tracking-[.08em] text-fg-muted">Elegibilidad sin confirmar</h3><p className="mt-0.5 text-sm text-fg-muted">Revisá en la fuente si podés participar desde tu país.</p></li>
          <li data-id="dataless" className="col-span-full pt-2 font-mono text-xs uppercase tracking-[.08em] text-fg-muted">Sin datos de competencia</li>
          <li data-id="af" className="col-span-full"><Affiliate url={affiliateUrl()} /></li>
          {listings.filter((l) => !l.featured).map((l) => <li key={l.id} data-id={l.id} className="flex-col"><ListingCard listing={l} now={now.toISOString()} /></li>)}
        </>} now={now.toISOString()} initial={{ f, sort }} affUrl={affiliateUrl()} hero={<>
        <h1 className="font-display text-[26px] font-semibold leading-8 tracking-[-.01em] lg:text-[44px] lg:font-extrabold lg:leading-[48px]"><span className="text-gradient">Oportunidades</span> para builders LatAm</h1>
        <UpdatedStamp iso={updated} open={open} counts={{ conf: 0, unc: 0 }} now={now.toISOString()} />
      </>} />
    </>
  );
}
