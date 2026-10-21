'use client';
import { useEffect, useState } from 'react';
import { regPill } from '@/lib/format';
import type { Listing } from '@/lib/types';
import { useTz } from './LocalTime';

/** Shared clock for card pill + countdown so both agree on which one shows. */
export function useNow(initialNow: string) {
  const [now, setNow] = useState(() => new Date(initialNow));
  useEffect(() => { setNow(new Date()); const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);
  return now;
}

export function DeadlinePill({ l, initialNow }: { l: Pick<Listing, 'deadlineAt'>; initialNow: string }) {
  const now = useNow(initialNow); const tz = useTz();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const p = regPill(l, now, tz);
  if (!p) return null;
  // Before hydration (and for crawlers) show a fixed, cache-safe text; the browser swaps in the live count.
  if (!mounted && p.kind !== 'closed') return <span className="dl-pill dl-pill--soft">Inscripciones hasta el {p.date}</span>;
  if (p.kind === 'closed') return <span className="dl-pill dl-pill--closed">Inscripción cerrada</span>;
  const urgent = p.kind !== 'soft';
  const dot = urgent && <span className="dl-dot" aria-hidden="true" />;
  if (p.kind === 'last') return <span className={`dl-pill dl-pill--urgent`}>{dot}Último día<span className="dl-opt">&nbsp;para inscribirte</span> · hasta {p.time}</span>;
  const n = p.days === 1 ? 'Queda 1 día' : `Quedan ${p.days} días`;
  if (urgent) return <span className="dl-pill dl-pill--urgent">{dot}{n} para inscribirte</span>;
  return <span className="dl-pill dl-pill--soft">{n}<span className="dl-opt">&nbsp;para inscribirte</span> · hasta {p.date}</span>;
}
