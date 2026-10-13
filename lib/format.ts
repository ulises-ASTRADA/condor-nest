import type { Listing } from './types';
export const TZ = 'America/Argentina/Buenos_Aires';
const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
export const num = (v: number) => nf.format(v);

export function sig2(v: number): number {
  if (v === 0) return 0;
  const p = Math.pow(10, Math.floor(Math.log10(Math.abs(v))) - 1);
  return Math.round(v / p) * p;
}

const STABLE_USD = new Set(['USD', 'USDC', 'USDT', 'USDG', 'UXD', 'PYUSD']);
export function rewardText(l: Listing): { main: string; prefix: string | null; approx: string | null; missing: boolean } {
  if (l.rewardKind === 'non_monetary') return { main: 'Premio no monetario', prefix: null, approx: null, missing: false };
  if (l.rewardAmount == null || l.rewardAmount <= 0) return { main: 'Premio: sin dato', prefix: null, approx: null, missing: true };
  const cur = (l.rewardCurrency ?? 'USD').toUpperCase();
  const main = cur === 'USD' ? `USD ${num(l.rewardAmount)}` : `${num(l.rewardAmount)} ${cur}`;
  const prefix = l.rewardKind === 'total_pool' ? 'Pozo' : l.rewardKind === 'top_prize' ? '1er premio' : null;
  const suffix = l.rewardKind === 'per_winner' ? ' por ganador' : '';
  const approx = cur !== 'USD' && l.rewardUsd != null ? `≈ USD ${num(l.rewardUsd)}` : null;
  return { main: main + suffix, prefix, approx, missing: false };
}
export { STABLE_USD };

const dtf = new Intl.DateTimeFormat('es-AR', { timeZone: TZ, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
export function artShort(iso: string): string {
  const p = Object.fromEntries(dtf.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  const wd = String(p.weekday).replace('.', '');
  return `${wd} ${p.day}/${p.month} · ${p.hour}:${p.minute} ART`;
}
const dShort = new Intl.DateTimeFormat('es-AR', { timeZone: TZ, day: '2-digit', month: '2-digit' });
export const artDay = (iso: string) => dShort.format(new Date(iso));
const dLong = new Intl.DateTimeFormat('es-AR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false });
export function srDate(iso: string, verb = 'Cierra'): string {
  const p = Object.fromEntries(dLong.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${verb} el ${p.weekday} ${p.day} de ${p.month} a las ${p.hour}:${p.minute}, hora de Argentina.`;
}
const full = new Intl.DateTimeFormat('es-AR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
export const artFull = (iso: string) => full.format(new Date(iso)) + ' ART';

export type DeadlineState = 'normal' | 'soon' | 'warning' | 'urgent' | 'closing' | 'closed' | 'unknown' | 'rolling';
export function deadlineInfo(l: Pick<Listing, 'deadlineAt' | 'startsAt' | 'type' | 'modality'>, now: Date) {
  let iso = l.deadlineAt; let verb: 'Cierra' | 'Empieza' = 'Cierra';
  if (!iso && l.modality !== 'online' && l.startsAt) { iso = l.startsAt; verb = 'Empieza'; }
  if (!iso) {
    const state: DeadlineState = l.type === 'grant' ? 'rolling' : 'unknown';
    return { state, iso: null, verb, label: state === 'rolling' ? 'Convocatoria abierta (sin fecha de cierre)' : 'Fecha de cierre sin confirmar', date: null as string | null, ms: null as number | null };
  }
  const ms = new Date(iso).getTime() - now.getTime();
  const h = ms / 3.6e6; const d = Math.floor(h / 24);
  const date = artShort(iso);
  let state: DeadlineState; let label: string;
  if (ms <= 0) { state = 'closed'; label = verb === 'Cierra' ? `Cerrado el ${artDay(iso)}` : `Empezó el ${artDay(iso)}`; }
  else if (h < 1) { state = 'closing'; label = `¡Último momento! ${Math.max(1, Math.floor(ms / 6e4))} min`; }
  else if (h < 24) { state = 'urgent'; label = `${verb} en ${Math.floor(h)} h ${Math.floor((ms % 3.6e6) / 6e4)} min`; }
  else if (h < 72) { state = 'warning'; label = `${verb} en ${d} d ${Math.floor(h % 24)} h`; }
  else if (h < 168) { state = 'soon'; label = `${verb} en ${d} d`; }
  else { state = 'normal'; label = `${verb} el ${date}`; }
  return { state, iso, verb, label, date, ms };
}

export function competitionText(l: Listing) {
  if (l.competitors == null) return { count: 'Competencia: sin dato', ratio: null as string | null, low: false };
  const unit = l.competitorsKind === 'registrations' ? 'inscriptos' : 'envíos';
  const unit1 = l.competitorsKind === 'registrations' ? 'inscripto' : 'envío';
  if (l.competitors === 0) return { count: l.competitorsKind === 'registrations' ? 'Todavía sin inscriptos' : 'Todavía sin envíos', ratio: null, low: true };
  const ratio = l.rewardUsd != null ? `≈ USD ${num(sig2(l.rewardUsd / l.competitors))} por ${unit1}` : null;
  return { count: `${num(l.competitors)} ${unit}`, ratio, low: false };
}

export const ELIG_LABEL: Record<Listing['eligibility'], string> = {
  ar: 'Solo Argentina', latam: 'Abierto a LatAm', global: 'Global (incluye AR)', restricted: 'Restringido', unknown: 'Elegibilidad sin confirmar',
};
export const TYPE_LABEL = { hackathon: 'Hackathon', bounty: 'Bounty', grant: 'Grant' } as const;
