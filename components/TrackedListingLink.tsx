'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cardContext, cardEvent, listingAnalyticsActive } from '@/lib/listing-analytics-client';
import type { CardPlacement } from '@/lib/listing-analytics';

export function TrackedListingLink({ slug, placement, className, children }: { slug: string; placement: CardPlacement; className: string; children: React.ReactNode }) {
  const router = useRouter();
  const prepare = (a: HTMLAnchorElement) => {
    // Do not add attribution parameters when tracking is disabled or storage is unavailable.
    try {
      if (!listingAnalyticsActive()) return;
      const context = cardContext(a);
      if (context) a.href = `/o/${slug}?cn_entry=${context.exposure}`;
    } catch { /* Normal link remains usable. */ }
  };
  const record = (a: HTMLAnchorElement) => {
    try { if (listingAnalyticsActive()) { prepare(a); cardEvent(a, 'card_click'); } } catch { /* Best effort. */ }
  };
  return <Link href={`/o/${slug}`} prefetch={false} data-cn-card={slug} data-cn-placement={placement} className={className}
    onPointerDown={(e) => prepare(e.currentTarget)} onKeyDown={(e) => { if (e.key === 'Enter') prepare(e.currentTarget); }} onContextMenu={(e) => prepare(e.currentTarget)}
    onAuxClick={(e) => { if (e.button === 1) record(e.currentTarget); }}
    onClick={(e) => {
      record(e.currentTarget);
      if (!e.defaultPrevented && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && e.button === 0 && e.currentTarget.search) {
        e.preventDefault(); router.push(e.currentTarget.pathname + e.currentTarget.search);
      }
    }}>{children}</Link>;
}
