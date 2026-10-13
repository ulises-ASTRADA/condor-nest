import { artFull, TZ } from '@/lib/format';
export function UpdatedStamp({ iso, open, now }: { iso: string | null; open: number; now: string }) {
  const stale = !iso || new Date(now).getTime() - new Date(iso).getTime() > 36 * 3.6e6;
  const day = (d: string) => new Intl.DateTimeFormat('es-AR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d));
  const hm = iso ? new Intl.DateTimeFormat('es-AR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)) : '';
  const when = iso ? (day(iso) === day(now) ? `hoy ${hm} ART` : artFull(iso)) : 'sin dato';
  return (
    <div className="mt-2 text-sm text-fg-muted">
      <p className="flex items-center gap-2"><span aria-hidden="true" className="h-2 w-2 animate-pulse-glow rounded-pill bg-cyan shadow-glow-cyan" />Actualizado {when} · <span className="font-mono tabular">{open}</span> abiertas</p>
      {stale && <p role="status" className="mt-1 text-warning">Los datos pueden estar desactualizados (última actualización {iso ? artFull(iso) : 'sin dato'}).</p>}
    </div>
  );
}
