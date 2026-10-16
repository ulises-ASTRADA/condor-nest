'use client';
import { useEffect } from 'react';
/** Pauses CSS loops when the tab is hidden; sets header fallback flag; hides aurora on saveData. */
export function ClientBoot() {
  useEffect(() => {
    const root = document.documentElement;
    const vis = () => root.classList.toggle('hidden-tab', document.hidden);
    document.addEventListener('visibilitychange', vis);
    const onScroll = () => document.querySelector('.site-header')?.toggleAttribute('data-scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    if ((navigator as any).connection?.saveData) document.querySelector('.bg-aurora')?.remove();
    root.setAttribute('data-motion-ready', '');
    // Card spotlight (delegated, so cards can stay Server Components).
    const spot = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.('article.card') as HTMLElement | null; if (!el) return;
      const b = el.getBoundingClientRect();
      requestAnimationFrame(() => { el.style.setProperty('--mx', `${e.clientX - b.left}px`); el.style.setProperty('--my', `${e.clientY - b.top}px`); });
    };
    document.addEventListener('pointermove', spot, { passive: true });
    return () => { document.removeEventListener('visibilitychange', vis); window.removeEventListener('scroll', onScroll); document.removeEventListener('pointermove', spot); };
  }, []);
  return null;
}
