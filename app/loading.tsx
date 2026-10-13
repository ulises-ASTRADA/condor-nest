import { SkeletonCard } from '@/components/ListingCard';
export default function Loading() {
  return <div className="mt-24 grid gap-3" aria-busy="true" aria-label="Cargando oportunidades">{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>;
}
