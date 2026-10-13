'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { deadlineInfo, srDate } from '@/lib/format';
import type { Listing } from '@/lib/types';
import { useReduceMotionPref } from './Toggles';
import { useTz } from './LocalTime';

const COLOR: Record<string, string> = { normal: 'text-fg-muted', soon: 'text-fg', warning: 'text-warning', urgent: 'text-danger font-bold', closing: 'text-danger font-bold', closed: 'text-fg-muted', unknown: 'text-fg-muted', rolling: 'text-fg-muted' };

function Roll({ text, still }: { text: string; still: boolean }) {
  if (still) return <span>{text}</span>;
  return (
    <span className="inline-flex">
      {text.split('').map((ch, i) => (
        <span key={i} className="relative inline-block overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span key={ch + i} className="inline-block whitespace-pre" initial={{ y: '40%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-40%', opacity: 0 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>{ch}</m.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

export function Countdown({ l, initialNow, seconds = false }: { l: Pick<Listing, 'deadlineAt' | 'startsAt' | 'type' | 'modality'>; initialNow: string; seconds?: boolean }) {
  const [now, setNow] = useState(() => new Date(initialNow));
  const sys = useReducedMotion(); const pref = useReduceMotionPref(); const still = !!sys || pref;
  const tz = useTz();
  const info = deadlineInfo(l, now, tz);
  const fast = seconds && info.state === 'closing';
  useEffect(() => { setNow(new Date()); const id = setInterval(() => setNow(new Date()), fast ? 1000 : 60000); return () => clearInterval(id); }, [fast]);
  let label = info.label;
  if (fast && info.ms != null) { const s = Math.floor(info.ms / 1000); label = `¡Último momento! ${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`; }
  const showIcon = ['warning', 'urgent', 'closing'].includes(info.state);
  const pulse = info.state === 'urgent' ? 'animate-pulse-glow' : info.state === 'closing' ? 'animate-pulse-fast' : '';
  const showDate = info.date && !['normal', 'closed'].includes(info.state);
  return (
    <div className={`font-mono text-sm tabular transition-colors duration-slow ${COLOR[info.state]}`}>
      {info.iso && <span className="sr-only">{srDate(info.iso, info.verb, tz)}</span>}
      <span aria-hidden="true" className="inline-flex flex-wrap items-center gap-x-1.5">
        {showIcon && <span className={`inline-flex items-center gap-1 ${pulse}`}><span className="h-1.5 w-1.5 rounded-pill bg-current shadow-[0_0_8px_currentColor]" />⏰</span>}
        <time dateTime={info.iso ?? undefined}><Roll text={label} still={still} /></time>
        {showDate && <span className="text-fg-muted">· {info.date}</span>}
      </span>
      {info.state === 'closing' && info.ms != null && (
        <span aria-hidden="true" className="mt-1 block h-0.5 origin-left bg-danger" style={{ transform: `scaleX(${Math.max(0, info.ms / 3.6e6)})` }} />
      )}
    </div>
  );
}
