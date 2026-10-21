'use client';
import { useEffect, useState } from 'react';
import { deadlineInfo, regPill, srDate } from '@/lib/format';
import type { Listing } from '@/lib/types';
import { useTz } from './LocalTime';
import { Ticker } from './Ticker';

const COLOR: Record<string, string> = { normal: 'text-fg-muted', soon: 'text-fg', warning: 'text-warning', urgent: 'text-danger font-bold', closing: 'text-danger font-bold', closed: 'text-fg-muted', unknown: 'text-fg-muted', rolling: 'text-fg-muted' };

export function Countdown({ l, initialNow, seconds = false, pillAware = false }: { l: Pick<Listing, 'deadlineAt' | 'startsAt' | 'type' | 'modality'>; initialNow: string; seconds?: boolean; pillAware?: boolean }) {
  const [now, setNow] = useState(() => new Date(initialNow));
  const tz = useTz();
  const info = deadlineInfo(l, now, tz);
  const fast = seconds && info.state === 'closing';
  useEffect(() => { setNow(new Date()); const id = setInterval(() => setNow(new Date()), fast ? 1000 : 60000); return () => clearInterval(id); }, [fast]);
  // Cards: within the last 7 days (or once closed) the registration pill replaces this block.
  if (pillAware && regPill(l, now, tz)) return null;
  let label = info.label;
  if (fast && info.ms != null) { const s = Math.floor(info.ms / 1000); label = `¡Último momento! ${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`; }
  const showIcon = ['warning', 'urgent', 'closing'].includes(info.state);
  const pulse = info.state === 'urgent' ? 'animate-pulse-glow' : info.state === 'closing' ? 'animate-pulse-fast' : '';
  const showDate = info.date && !['normal', 'closed'].includes(info.state);
  return (
    <div className={`min-w-0 break-words font-mono text-sm tabular transition-colors duration-slow ${COLOR[info.state]}`}>
      {info.iso && <span className="sr-only">{srDate(info.iso, info.verb, tz)}</span>}
      <span aria-hidden="true" className="inline-flex max-w-full flex-wrap items-center gap-x-1.5">
        {showIcon && <span className={`inline-flex items-center gap-1 ${pulse}`}><span className="h-1.5 w-1.5 rounded-pill bg-current shadow-[0_0_8px_currentColor]" />⏰</span>}
        <time dateTime={info.iso ?? undefined}><Ticker text={label} /></time>
        {showDate && <span className="basis-full text-fg-muted">{info.date}</span>}
      </span>
      {info.state === 'closing' && info.ms != null && (
        <span aria-hidden="true" className="mt-1 block h-0.5 origin-left bg-danger" style={{ transform: `scaleX(${Math.max(0, info.ms / 3.6e6)})` }} />
      )}
    </div>
  );
}
