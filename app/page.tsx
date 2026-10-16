import { OG_IMAGE } from '@/lib/site';
import { getListings, lastIngest } from '@/lib/supabase';
import { filtersFromSearch } from '@/lib/rank';
import { Feed } from '@/components/Feed';
import { ListingCard } from '@/components/ListingCard';
import Link from 'next/link';
import { Affiliate } from '@/components/Affiliate';
import { affiliateUrl } from '@/components/Affiliate';
import { UpdatedStamp } from '@/components/UpdatedStamp';
import { isOpen, sortListings } from '@/lib/rank';
import { ORG, WEBSITE, ldScript } from '@/lib/jsonld';
import { SITE } from '@/lib/site';
export const metadata = { alternates: { canonical: '/' }, openGraph: { images: [OG_IMAGE], url: '/' } };
import { headers } from 'next/headers';
import { isLatam } from '@/lib/geo';
export const revalidate = 300;

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const [listings, updated] = await Promise.all([getListings(), lastIngest()]);
  const now = new Date();
  const { f, sort } = filtersFromSearch(sp);
  // Country only (no IP is read or kept). CN_GEO_FORCE lets local builds simulate a country; ignored on Vercel.
  const hdr = (await headers()).get('x-vercel-ip-country');
  const forced = process.env.VERCEL ? null : process.env.CN_GEO_FORCE ?? null;
  const raw = (forced ?? hdr ?? '').toUpperCase();
  const geo = { country: isLatam(raw) ? raw : null, known: !!raw, explicit: sp.pais !== undefined };
  const open = listings.filter((l) => isOpen(l, now)).length;
  const openList = sortListings(listings.filter((l) => isOpen(l, now)), 'cierra-pronto', now);
  const ld = { '@context': 'https://schema.org', '@graph': [WEBSITE, ORG, {
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
            <p className="mt-1 text-xs text-fg-muted"><Link href="/publicar" className="hover:text-fg">Espacio pago · ¿Qué es esto?</Link></p>
          </div>
        ))}
        cards={<>
          <li data-id="dataless" className="col-span-full pt-2 font-mono text-xs uppercase tracking-[.08em] text-fg-muted">Sin datos de competencia</li>
          <li data-id="af" className="col-span-full"><Affiliate url={affiliateUrl()} /></li>
          {listings.filter((l) => !l.featured).map((l) => <li key={l.id} data-id={l.id} className="flex-col"><ListingCard listing={l} now={now.toISOString()} /></li>)}
        </>} now={now.toISOString()} initial={{ f, sort }} geo={geo} affUrl={affiliateUrl()} hero={<>
        <h1 className="font-display text-[26px] font-semibold leading-8 tracking-[-.01em] lg:text-[44px] lg:font-extrabold lg:leading-[48px]"><span className="text-gradient">Oportunidades</span> para builders LatAm</h1>
        <UpdatedStamp iso={updated} open={open} now={now.toISOString()} />
      </>} />
    </>
  );
}
