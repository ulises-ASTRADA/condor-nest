import { getListings, lastIngest } from '@/lib/supabase';
import { filtersFromSearch } from '@/lib/rank';
import { Feed } from '@/components/Feed';
import { affiliateUrl } from '@/components/Affiliate';
import { UpdatedStamp } from '@/components/UpdatedStamp';
import { isOpen } from '@/lib/rank';
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
  return (
    <>
      <Feed listings={listings} now={now.toISOString()} initial={{ f, sort }} geo={geo} affUrl={affiliateUrl()} hero={<>
        <h1 className="font-display text-[26px] font-semibold leading-8 tracking-[-.01em] lg:text-[44px] lg:font-extrabold lg:leading-[48px]"><span className="text-gradient">Oportunidades</span> para builders LatAm</h1>
        <UpdatedStamp iso={updated} open={open} now={now.toISOString()} />
      </>} />
    </>
  );
}
