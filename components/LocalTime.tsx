'use client';
import { useSyncExternalStore } from 'react';
import { artDay, artFull, artShort, TZ, tzLabel } from '@/lib/format';

let detected: string | null = null;
function detect(): string {
  if (detected) return detected;
  try {
    const z = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (z) { new Intl.DateTimeFormat('es-AR', { timeZone: z }); detected = z; return z; }
  } catch { /* fall through */ }
  detected = TZ; return TZ;
}
const noop = () => () => {};
/** Visitor's IANA zone. SSR and the hydration pass get the Buenos Aires fallback; the client then switches to the detected zone. */
export function useTz(): string {
  return useSyncExternalStore(noop, detect, () => TZ);
}

export function LocalTime({ iso, format = 'short', className }: { iso: string; format?: 'short' | 'full' | 'day'; className?: string }) {
  const tz = useTz();
  const text = format === 'full' ? artFull(iso, tz) : format === 'day' ? artDay(iso, tz) : artShort(iso, tz);
  return <time dateTime={iso} className={className} title={tzLabel(tz, iso)}>{text}</time>;
}

export function TzLabel({ prefix = '', className }: { prefix?: string; className?: string }) {
  const tz = useTz();
  return <span className={className}>{prefix}{tzLabel(tz)}</span>;
}
