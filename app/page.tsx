import { getListings, lastIngest } from '@/lib/supabase';
import { filtersFromSearch } from '@/lib/rank';
import { Feed } from '@/components/Feed';
import { affiliateUrl } from '@/components/Affiliate';
import { UpdatedStamp } from '@/components/UpdatedStamp';
import { isOpen } from '@/lib/rank';
export const revalidate = 300;

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const [listings, updated] = await Promise.all([getListings(), lastIngest()]);
  const now = new Date();
  const { f, sort } = filtersFromSearch(sp);
  const open = listings.filter((l) => isOpen(l, now)).length;
  return (
    <>
      <Feed listings={listings} now={now.toISOString()} initial={{ f, sort }} affUrl={affiliateUrl()} hero={<>
        <h1 className="font-display text-[26px] font-semibold leading-8 tracking-[-.01em] lg:text-[44px] lg:font-extrabold lg:leading-[48px]"><span className="text-gradient">Oportunidades</span> para builders LatAm</h1>
        <UpdatedStamp iso={updated} open={open} now={now.toISOString()} />
      </>} />
    </>
  );
}
