'use client';
import { artFull, dayKey, hhmm, tzOffset } from '@/lib/format';
import { TzLabel, useTz } from './LocalTime';
/** "Actualizado el dd/mm/aaaa" from the real latest data change (newest listing update or ingest run). */
export function UpdatedStamp({ iso, open, now }: { iso: string | null; open: number; now: string }) {
  const tz = useTz();
  const stale = !iso || new Date(now).getTime() - new Date(iso).getTime() > 36 * 3.6e6;
  const today = iso && dayKey(iso, tz) === dayKey(now, tz);
  return (
    <div className="mt-1.5 font-mono text-sm text-fg-muted">
      <p className="flex flex-wrap items-center gap-x-2">
        <span aria-hidden="true" className="h-2 w-2 rounded-pill bg-cyan shadow-glow-cyan" />
        {iso ? (
          <time dateTime={iso} title={artFull(iso, tz)} className="whitespace-nowrap">
            <span className="sm:hidden">Actualizado {today ? 'hoy' : `el ${dayKey(iso, tz)}`} {hhmm(iso, tz)}</span>
            <span className="max-sm:hidden">Actualizado el {dayKey(iso, tz)} a las {hhmm(iso, tz)} {tzOffset(tz, iso)}</span>
          </time>
        ) : <span>Actualizado: sin dato</span>}
        <span aria-hidden="true">·</span><span className="whitespace-nowrap"><span className="tabular">{open}</span> abiertas</span>
      </p>
      <p className="mt-0.5 text-xs"><TzLabel prefix="Horarios en tu " /></p>
      {stale && <p role="status" className="mt-1 text-warning">Los datos pueden estar desactualizados (última actualización {iso ? artFull(iso, tz) : 'sin dato'}).</p>}
    </div>
  );
}
