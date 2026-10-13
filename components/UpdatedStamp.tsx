'use client';
import { artFull, dayKey, hhmm, tzOffset } from '@/lib/format';
import { TzLabel, useTz } from './LocalTime';
export function UpdatedStamp({ iso, open, now }: { iso: string | null; open: number; now: string }) {
  const tz = useTz();
  const stale = !iso || new Date(now).getTime() - new Date(iso).getTime() > 36 * 3.6e6;
  const when = iso ? (dayKey(iso, tz) === dayKey(now, tz) ? `hoy ${hhmm(iso, tz)} ${tzOffset(tz, iso)}` : artFull(iso, tz)) : 'sin dato';
  return (
    <div className="mt-1.5 font-mono text-sm text-fg-muted">
      <p className="flex items-center gap-2"><span aria-hidden="true" className="h-2 w-2 animate-pulse-glow rounded-pill bg-cyan shadow-glow-cyan" />Actualizado {when} · <span className="font-mono tabular">{open}</span> abiertas</p>
      <p className="mt-0.5 text-xs"><TzLabel prefix="Horarios en tu " /></p>
      {stale && <p role="status" className="mt-1 text-warning">Los datos pueden estar desactualizados (última actualización {iso ? artFull(iso, tz) : 'sin dato'}).</p>}
    </div>
  );
}
