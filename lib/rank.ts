import type { Listing, ListingType } from './types';
export type Sort = 'cierra-pronto' | 'mayor-premio' | 'menos-competencia' | 'mas-nuevos';
export const SORTS: { id: Sort; label: string }[] = [
  { id: 'cierra-pronto', label: 'Cierra pronto' }, { id: 'mayor-premio', label: 'Mayor premio' },
  { id: 'menos-competencia', label: 'Menos competencia' }, { id: 'mas-nuevos', label: 'Más nuevos' },
];
export type Filters = { tipo: ListingType | null; irl: boolean; q: string; showClosed: boolean };
export const DEFAULT_FILTERS: Filters = { tipo: null, irl: false, q: '', showClosed: false };

/** deadline used for open/closed + ordering: deadline, else IRL start */
export const effDeadline = (l: Listing) => l.deadlineAt ?? (l.modality !== 'online' ? l.startsAt : null);
export const isOpen = (l: Listing, now: Date) => { const d = effDeadline(l); return !d || new Date(d) > now; };

export function matches(l: Listing, f: Filters, now: Date): boolean {
  if (!f.showClosed && !isOpen(l, now)) return false;
  if (f.tipo && l.type !== f.tipo) return false;
  if (f.irl && l.modality === 'online') return false;
  if (f.q) {
    const q = norm(f.q);
    const hay = norm([l.title, l.organizer, l.city, ...l.ecosystems].filter(Boolean).join(' '));
    if (!hay.includes(q)) return false;
  }
  return true;
}
const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function competitionScore(l: Listing): number | null {
  if (l.rewardUsd == null || l.competitors == null) return null;
  const k = l.competitorsKind === 'submissions' ? 1 : 0.5; // [GUESS] per spec
  return l.rewardUsd / (l.competitors * k + 1);
}
const t = (iso: string | null) => (iso ? new Date(iso).getTime() : Infinity);

export function sortListings(list: Listing[], sort: Sort, now: Date): Listing[] {
  const a = [...list];
  const byDeadline = (x: Listing, y: Listing) => t(effDeadline(x)) - t(effDeadline(y));
  if (sort === 'cierra-pronto') return a.sort(byDeadline);
  if (sort === 'mayor-premio') return a.sort((x, y) => (y.rewardUsd ?? -1) - (x.rewardUsd ?? -1) || byDeadline(x, y));
  if (sort === 'mas-nuevos') return a.sort((x, y) => t(y.createdAt) - t(x.createdAt));
  return a.sort((x, y) => {
    const sx = isOpen(x, now) ? competitionScore(x) : null; const sy = isOpen(y, now) ? competitionScore(y) : null;
    const ex = sx != null ? 1 : 0; const ey = sy != null ? 1 : 0;
    if (ex !== ey) return ey - ex;
    if (sx != null && sy != null && sx !== sy) return sy - sx;
    return byDeadline(x, y);
  });
}

export function filtersFromSearch(sp: Record<string, string | string[] | undefined>): { f: Filters; sort: Sort } {
  const g = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) as string | undefined;
  const tipo = g('tipo');
  const orden = g('orden') as Sort | undefined;
  return {
    f: {
      tipo: tipo === 'hackathon' || tipo === 'bounty' || tipo === 'grant' ? tipo : null,
      irl: g('modalidad') === 'irl',
      q: g('q') ?? '',
      showClosed: g('cerradas') === '1',
    },
    sort: SORTS.some((s) => s.id === orden) ? orden! : 'cierra-pronto',
  };
}
export function filtersToSearch(f: Filters, sort: Sort): string {
  const p = new URLSearchParams();
  if (f.tipo) p.set('tipo', f.tipo);
  if (f.irl) p.set('modalidad', 'irl');
  if (f.q) p.set('q', f.q);
  if (f.showClosed) p.set('cerradas', '1');
  if (sort !== 'cierra-pronto') p.set('orden', sort);
  return p.toString();
}
