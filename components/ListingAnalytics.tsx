'use client';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ANALYTICS_UUID, publicAnalyticsPath } from '@/lib/listing-analytics';
import { cardContext, cardEvent, emitListingEvent, flushListingEvents, listingAnalyticsActive } from '@/lib/listing-analytics-client';

/** One observer for server-rendered cards; hidden/filter-excluded cards never receive impressions. */
export function ListingAnalytics() {
  const path = usePathname();
  const entry = useSearchParams().get('cn_entry');
  useEffect(() => {
    try { if (!publicAnalyticsPath(path) || !listingAnalyticsActive()) return; } catch { return; }
    const exposure = entry && ANALYTICS_UUID.test(entry) ? entry : null;
    if (path.startsWith('/o/')) {
      emitListingEvent({ id: crypto.randomUUID(), kind: 'detail_view', slug: path.slice(3), path, placement: 'detail', position: null, exposure });
      // Preserve the entry in all registration links, including official links and the location card.
      // Server-side RPC only attributes an entry matching a real card_click for this listing, within 30 min.
      for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
        const url = new URL(a.href);
        if (url.origin === window.location.origin && url.pathname === `/go/${path.slice(3)}` && exposure) { url.searchParams.set('cn_entry', exposure); a.href = url.toString(); }
      }
    }
    if (!('IntersectionObserver' in window)) return;
    const pending = new Map<HTMLAnchorElement, ReturnType<typeof setTimeout>>();
    const visible = new Set<HTMLAnchorElement>();
    const counted = new Set<string>();
    const cancel = (a: HTMLAnchorElement) => { clearTimeout(pending.get(a)); pending.delete(a); };
    const schedule = (a: HTMLAnchorElement) => {
      if (document.visibilityState !== 'visible' || pending.has(a)) return;
      const context = cardContext(a);
      if (!context || counted.has(context.exposure)) return;
      pending.set(a, setTimeout(() => {
        pending.delete(a);
        const current = cardContext(a);
        const rect = a.getBoundingClientRect();
        const area = rect.width * rect.height;
        const inView = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0)) * Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
        if (!current || !visible.has(a) || document.visibilityState !== 'visible' || !area || inView / area < 0.5) return;
        // Moving to another position/filter must start a new full second.
        if (current.exposure !== context.exposure) { schedule(a); return; }
        if (!counted.has(current.exposure)) { counted.add(current.exposure); cardEvent(a, 'impression'); }
      }, 1000));
    };
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const a = e.target as HTMLAnchorElement;
        if (e.isIntersecting && e.intersectionRatio >= 0.5) { visible.add(a); schedule(a); }
        else { visible.delete(a); cancel(a); }
      }
    }, { threshold: [0, 0.5] });
    for (const a of document.querySelectorAll<HTMLAnchorElement>('[data-cn-card]')) observer.observe(a);
    const visibility = () => {
      if (document.visibilityState !== 'visible') { pending.forEach(clearTimeout); pending.clear(); flushListingEvents(); }
      else visible.forEach(schedule);
    };
    // Feed changes are CSS-only. Recheck positions and reset timers when its stylesheet changes.
    const mutations = new MutationObserver(() => { visible.forEach((a) => { cancel(a); schedule(a); }); });
    const feed = document.getElementById('cn-feed-visibility');
    if (feed) mutations.observe(feed, { childList: true, subtree: true, characterData: true });
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', flushListingEvents);
    return () => {
      observer.disconnect(); mutations.disconnect(); pending.forEach(clearTimeout);
      document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', flushListingEvents); flushListingEvents();
    };
  }, [path, entry]);
  return null;
}
