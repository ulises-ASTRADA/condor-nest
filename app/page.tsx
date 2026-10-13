import { getListings, lastIngest } from '@/lib/supabase';
import { filtersFromSearch } from '@/lib/rank';
import { Feed } from '@/components/Feed';
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
      <section className="pb-4 pt-6 lg:pt-10">
        <h1 className="font-display text-2xl font-semibold lg:text-4xl lg:font-extrabold"><span className="text-gradient">Oportunidades para builders LatAm</span></h1>
        <p className="mt-2 text-fg-muted">Hackathons, bounties y grants en LatAm o solo para LatAm, en un solo feed, actualizado todos los días.</p>
        <UpdatedStamp iso={updated} open={open} now={now.toISOString()} />
      </section>
      <Feed listings={listings} now={now.toISOString()} initial={{ f, sort }} />
    </>
  );
}
