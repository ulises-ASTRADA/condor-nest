'use client';
import Link from 'next/link';
import type { Listing } from '@/lib/types';
import { SOURCE_LABEL } from '@/lib/types';
import { competitionText, rewardText } from '@/lib/format';
import { isOpen } from '@/lib/rank';
import { TypeBadge, EligBadge } from './Badges';
import { Countdown } from './Countdown';

export function ListingCard({ listing: l, variant = 'default', now }: { listing: Listing; variant?: 'default' | 'featured' | 'compact'; now: string }) {
  const r = rewardText(l); const c = competitionText(l);
  const closed = !isOpen(l, new Date(now));
  const spot = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget; const b = el.getBoundingClientRect();
    requestAnimationFrame(() => { el.style.setProperty('--mx', `${e.clientX - b.left}px`); el.style.setProperty('--my', `${e.clientY - b.top}px`); });
  };
  return (
    <Link href={`/o/${l.slug}`} className="card-link group flex h-full flex-col rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
      <article onPointerMove={spot}
        className={`card flex h-full flex-1 flex-col rounded-card p-4 transition-[transform,border-color,filter,opacity] duration-fast ease-out-expo ${variant === 'featured' ? 'featured' : 'border border-border bg-surface group-hover:border-lime/60'} ${closed ? 'opacity-60 grayscale-[.6] duration-slow' : ''}`}
        style={{ viewTransitionName: variant === 'compact' ? undefined : `listing-${l.id}` } as React.CSSProperties}>
        {variant === 'featured' && (
          <span data-featured-pill className="featured-pill mb-2 inline-block rounded-pill bg-magenta px-2 py-0.5 font-mono text-xs uppercase tracking-[.08em] text-[#07080B]">Destacado</span>
        )}
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-fg-muted">
          <TypeBadge type={l.type} /> <EligBadge l={l} /> <span>· {l.organizer ?? SOURCE_LABEL[l.source]}</span>
        </div>
        <h3 lang={l.titleLang === 'en' ? 'en' : undefined} className={`mt-2 line-clamp-2 font-medium ${variant === 'compact' ? 'text-base' : 'text-lg'}`}>{l.title}</h3>
        <div className="mt-auto pt-2">
        {variant !== 'compact' && (
          <p className={`font-mono tabular ${r.missing ? (l.rewardText ? 'line-clamp-2 text-sm text-fg' : 'text-sm text-fg-muted') : 'text-xl'}`}>
            {r.prefix && <span className="mr-1.5 text-xs uppercase tracking-[.08em] text-fg-muted">{r.prefix}</span>}
            {r.main}{r.approx && <span className="ml-2 text-sm text-fg-muted">{r.approx}</span>}
          </p>
        )}
        <div className="mt-2"><Countdown l={l} initialNow={now} /></div>
        {variant !== 'compact' && (
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 font-mono text-sm tabular text-fg-muted">
            <span aria-hidden="true">👥</span><span>{c.count}</span>
            {c.ratio && <span>· {c.ratio}</span>}
            {c.low && <span className="rounded-pill border border-success/50 px-2 font-mono text-xs uppercase tracking-[.08em] text-success">Poca competencia</span>}
          </p>
        )}
        </div>
      </article>
    </Link>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-card border border-border bg-surface p-4" aria-hidden="true">
      <div className="skel h-5 w-40 rounded-pill" /><div className="skel mt-3 h-5 w-full rounded" /><div className="skel mt-2 h-5 w-2/3 rounded" />
      <div className="skel mt-3 h-6 w-32 rounded" /><div className="skel mt-2 h-4 w-48 rounded" />
    </div>
  );
}
