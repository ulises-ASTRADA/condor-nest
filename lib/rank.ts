import type { Listing, ListingType } from './types';
import { ecosOf, ECOSYSTEMS, type Eco } from './eco';
export type Sort = 'cierra-pronto' | 'mayor-premio' | 'menos-competencia' | 'mas-nuevos';
export const SORTS: { id: Sort; label: string }[] = [
  { id: 'cierra-pronto', label: 'Cierra pronto' }, { id: 'mayor-premio', label: 'Mayor premio' },
  { id: 'menos-competencia', label: 'Menos competencia' }, { id: 'mas-nuevos', label: 'Más nuevos' },
];
export type Modality = 'online' | 'irl';
export type Filters = { tipos: ListingType[]; modalidades: Modality[]; ecos: Eco[]; q: string; showClosed: boolean; pais: string | null };
export const ALL_TYPES: ListingType[] = ['hackathon', 'bounty', 'grant'];
export const DEFAULT_FILTERS: Filters = { tipos: [...ALL_TYPES], modalidades: [], ecos: [], q: '', showClosed: false, pais: null };

/** deadline used for open/closed + ordering: deadline, else IRL start */
export const effDeadline = (l: Listing) => l.deadlineAt ?? (l.modality !== 'online' ? l.startsAt : null);
export const isOpen = (l: Listing, now: Date) => { const d = effDeadline(l); return !d || new Date(d) > now; };

export function matches(l: Listing, f: Filters, now: Date): boolean {
  if (!f.showClosed && !isOpen(l, now)) return false;
  if (!f.tipos.includes(l.type)) return false;
  if (f.modalidades.length) { const m: Modality = l.modality === 'online' ? 'online' : 'irl'; if (!f.modalidades.includes(m) && !(l.modality === 'hybrid')) return false; }
  if (f.pais && !matchesPais(l, f.pais)) return false;
  if (f.ecos.length && !ecosOf(l).some((e) => f.ecos.includes(e))) return false;
  if (f.q) {
    const q = norm(f.q);
    const hay = norm([l.title, l.organizer, l.city, ...l.ecosystems].filter(Boolean).join(' '));
    if (!hay.includes(q)) return false;
  }
  return true;
}
/** Listing is in / for this country itself (not counting LatAm-wide ones). */
export const inCountry = (l: Listing, iso: string) => l.country === iso || (iso === 'AR' && l.eligibility === 'ar');
/** Country view: the country's own listings plus ones open to all of LatAm or online without a country restriction. */
export function matchesPais(l: Listing, iso: string): boolean {
  if (inCountry(l, iso)) return true;
  if (l.eligibility === 'latam' || l.country === 'LATAM') return true;
  return l.modality === 'online' && l.eligibility !== 'ar' && l.eligibility !== 'restricted' && (!l.country || l.country === 'LATAM');
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
  const list = (k: string) => (g(k) ?? '').split(',').filter(Boolean);
  const orden = g('orden') as Sort | undefined;
  return {
    f: {
      tipos: g('tipo') ? (list('tipo').filter((t) => (ALL_TYPES as string[]).includes(t)) as ListingType[]) : [...ALL_TYPES],
      modalidades: list('modalidad').filter((m) => m === 'online' || m === 'irl') as Modality[],
      ecos: list('eco').map((e) => ECOSYSTEMS.find((x) => x.toLowerCase() === e.toLowerCase())).filter(Boolean) as Eco[],
      q: g('q') ?? '',
      showClosed: g('cerradas') === '1',
      pais: /^[A-Za-z]{2}$/.test(g('pais') ?? '') ? g('pais')!.toUpperCase() : null,
    },
    sort: SORTS.some((s) => s.id === orden) ? orden! : 'cierra-pronto',
  };
}
export function filtersToSearch(f: Filters, sort: Sort): string {
  const p = new URLSearchParams();
  if (f.tipos.length !== ALL_TYPES.length) p.set('tipo', f.tipos.join(','));
  if (f.modalidades.length) p.set('modalidad', f.modalidades.join(','));
  if (f.ecos.length) p.set('eco', f.ecos.map((e) => e.toLowerCase()).join(','));
  if (f.q) p.set('q', f.q);
  if (f.showClosed) p.set('cerradas', '1');
  if (f.pais) p.set('pais', f.pais.toLowerCase());
  if (sort !== 'cierra-pronto') p.set('orden', sort);
  return p.toString();
}
