import type { Listing, ListingType } from './types';
import { ecosOf, ECOSYSTEMS, type Eco } from './eco';
import { citySlug } from './city';
import { COUNTRY_ES } from './geo';
export type Sort = 'cierra-pronto' | 'mayor-premio' | 'menos-competencia' | 'mas-nuevos';
export const SORTS: { id: Sort; label: string }[] = [
  { id: 'cierra-pronto', label: 'Cierra pronto' }, { id: 'mayor-premio', label: 'Mayor premio' },
  { id: 'menos-competencia', label: 'Menos competencia' }, { id: 'mas-nuevos', label: 'Más nuevos' },
];
/** ciudad: slug from cityOptions() (never a raw URL value); virtual: online + hybrid; abiertoTodos: access(l) === 'todos'. */
export type Filters = { tipos: ListingType[]; ecos: Eco[]; q: string; showClosed: boolean; pais: string | null; abierto: boolean; sinConfirmar: boolean; ciudad: string | null; virtual: boolean; abiertoTodos: boolean };
export const ALL_TYPES: ListingType[] = ['hackathon', 'bounty', 'grant'];
export const DEFAULT_FILTERS: Filters = { tipos: [...ALL_TYPES], ecos: [], q: '', showClosed: false, pais: null, abierto: true, sinConfirmar: true, ciudad: null, virtual: false, abiertoTodos: false }; // sinConfirmar = show unknown-eligibility listings (at the end)

/** deadline used for open/closed + ordering: deadline, else IRL start */
export const effDeadline = (l: Listing) => l.deadlineAt ?? (l.modality !== 'online' ? l.startsAt : null);
export const isOpen = (l: Listing, now: Date) => { const d = effDeadline(l); return !d || new Date(d) > now; };

export function matches(l: Listing, f: Filters, now: Date): boolean {
  if (!f.showClosed && !isOpen(l, now)) return false;
  if (!f.tipos.includes(l.type)) return false;
  if (f.virtual && l.modality === 'irl') return false; // hybrid can be joined remotely
  if (f.ciudad && !(l.modality !== 'online' && l.city && citySlug(l.city) === f.ciudad)) return false;
  if (f.abiertoTodos && access(l) !== 'todos') return false;
  if (f.pais && !matchesPais(l, f.pais)) return false;
  if (f.abierto && !openToArLatam(l) && !(f.pais && l.country === f.pais)) return false;
  if (f.abierto && !f.sinConfirmar && l.eligibility === 'unknown') return false;
  if (f.ecos.length && !ecosOf(l).some((e) => f.ecos.includes(e))) return false;
  if (f.q) {
    const q = norm(f.q);
    const hay = norm([l.title, l.organizer, l.city, ...l.ecosystems].filter(Boolean).join(' '));
    if (!hay.includes(q)) return false;
  }
  return true;
}
/** Access tag rule. Requirements = eligibility restricted/ar, or the short label / note states an age limit or a student-only condition.
 *  Deliberately narrow: "abierto a estudiantes, profesionales…" lists who is welcome and is NOT a requirement. */
const AGE_RE = /(\+\s?\d{1,2}\b|\d{1,2}\s*(?:a|–|-)\s*\d{1,2}\s*años|desde\s+(?:los\s+)?\d{1,2}\s*años|\d{1,2}\s*años\s+o\s+más|mayores\s+de\s+(?:edad|\d{1,2})|menores\s+de\s+\d{1,2})/i;
const STUDENT_RE = /((?:solo|sólo|únicamente|exclusivamente|exclusivo)\s+(?:para\s+)?(?:estudiantes|alumn[oa]s)|^\s*(?:estudiantes|alumn[oa]s)\b)/i;
export function hasRequirements(l: Listing): boolean {
  if (l.eligibility === 'restricted' || l.eligibility === 'ar') return true;
  return [l.eligibilityShort, l.eligibilityNote].some((t) => !!t && (AGE_RE.test(t) || STUDENT_RE.test(t)));
}
export type Access = 'todos' | 'requisitos' | 'confirmar';
export const access = (l: Listing): Access => (l.eligibility === 'unknown' ? 'confirmar' : hasRequirements(l) ? 'requisitos' : 'todos');
export const ACCESS_LABEL: Record<Access, string> = { todos: 'Abierto a todos', requisitos: 'Con requisitos', confirmar: 'Requisitos a confirmar' };

export type CityOpt = { slug: string; name: string; countries: string[] };
/** Cities of in-person/hybrid listings (the only valid ?ciudad= values). Display name = most common spelling. */
export function cityOptions(all: Listing[]): CityOpt[] {
  const m = new Map<string, { names: Map<string, number>; countries: Set<string> }>();
  for (const l of all) {
    if (l.modality === 'online' || !l.city?.trim()) continue;
    const k = citySlug(l.city); if (!k) continue;
    const e = m.get(k) ?? { names: new Map(), countries: new Set() }; m.set(k, e);
    e.names.set(l.city.trim(), (e.names.get(l.city.trim()) ?? 0) + 1); if (l.country) e.countries.add(l.country);
  }
  return [...m].map(([slug, e]) => ({ slug, name: [...e.names].sort((a, b) => b[1] - a[1])[0][0], countries: [...e.countries] }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/** Valid ?pais= / ?ciudad= values, derived from the listings (never from the URL). */
export type LocCtx = { cities: CityOpt[]; countries: string[] };
export function locationContext(all: Listing[]): LocCtx {
  const cities = cityOptions(all);
  const countries = Object.keys(COUNTRY_ES).filter((c) => all.some((l) => inCountry(l, c)) || cities.some((x) => x.countries.includes(c)))
    .sort((a, b) => COUNTRY_ES[a].localeCompare(COUNTRY_ES[b], 'es'));
  return { cities, countries };
}
/** Every matching listing is displayed once, whether featured or organic. */
export const feedCount = (all: Listing[], f: Filters, now: Date) => all.filter((l) => matches(l, f, now)).length;
export type LocGroup = { iso: string; name: string; n: number; cities: (CityOpt & { n: number })[] };
/** Location select model: one group per country ("Toda <país> (n)" + cities (n)); n = feedCount after picking that option with every
 *  other filter kept (so it includes LatAm-wide/online cards). A country group is listed only if ≥1 of those cards is specific to it
 *  (held there or restricted to it); cities with n = 0 are hidden. The selected country/city is always kept (?pais=cl stays valid). */
export function locationGroups(all: Listing[], ctx: LocCtx, f: Filters, now: Date): LocGroup[] {
  return ctx.countries.map((iso) => ({
    iso, name: COUNTRY_ES[iso], n: feedCount(all, { ...f, pais: iso, ciudad: null }, now),
    cities: ctx.cities.filter((c) => c.countries.includes(iso)).map((c) => ({ ...c, n: feedCount(all, { ...f, pais: iso, ciudad: c.slug }, now) }))
      .filter((c) => c.n > 0 || (f.ciudad === c.slug && f.pais === iso)),
  })).filter((g) => g.iso === f.pais || all.some((l) => inCountry(l, g.iso) && matches(l, { ...f, pais: g.iso, ciudad: null }, now)));
}

/** "Abierto a AR/LatAm": hides listings restricted to another country (e.g. "Solo México"). */
export const openToArLatam = (l: Listing) => l.eligibility !== 'restricted'; // 'restricted' = non-AR-wide limit (country 'ar' uses eligibility 'ar')
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

/** Any sort: confirmed-eligibility listings first, unknown eligibility always after (stable). */
export function sortListings(list: Listing[], sort: Sort, now: Date): Listing[] {
  const s = sortRaw(list, sort, now);
  return [...s.filter((l) => l.eligibility !== 'unknown'), ...s.filter((l) => l.eligibility === 'unknown')];
}
function sortRaw(list: Listing[], sort: Sort, now: Date): Listing[] {
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

/** cities: cityOptions(listings). ?ciudad= is normalized (accents/case/spaces) and accepted only when it equals a derived slug; a city
 *  implies its country (?ciudad alone infers ?pais), and a city outside an explicit ?pais= is ignored. ?pais= must be a derived country
 *  (case-insensitive). Unknown values are ignored.
 *  ?virtual= and ?abierto= accept only '1'. Legacy ?modalidad=online (without irl) maps to virtual. */
export function filtersFromSearch(sp: Record<string, string | string[] | undefined>, ctx: LocCtx = { cities: [], countries: [] }): { f: Filters; sort: Sort } {
  const { cities, countries } = ctx;
  const g = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) as string | undefined;
  const list = (k: string) => (g(k) ?? '').split(',').filter(Boolean);
  const orden = g('orden') as Sort | undefined;
  const paisRaw = (g('pais') ?? '').trim().toUpperCase();
  const paisQ = countries.includes(paisRaw) ? paisRaw : null; // unknown/invalid ?pais= is ignored (like ?ciudad=xx)
  const mods = list('modalidad');
  const rawCity = g('ciudad');
  const wanted = rawCity ? citySlug(rawCity.slice(0, 80)) : '';
  const hit = wanted ? cities.find((c) => c.slug === wanted) : undefined;
  const city = hit && (paisQ ? hit.countries.includes(paisQ) : true) ? hit : undefined;
  const pais = paisQ ?? (city?.countries.length === 1 ? city.countries[0] : null);
  return {
    f: {
      tipos: g('tipo') ? (list('tipo').filter((t) => (ALL_TYPES as string[]).includes(t)) as ListingType[]) : [...ALL_TYPES],
      ecos: list('eco').map((e) => ECOSYSTEMS.find((x) => x.toLowerCase() === e.toLowerCase())).filter(Boolean) as Eco[],
      q: g('q') ?? '',
      showClosed: g('cerradas') === '1',
      abierto: true, // always on (hides other-country-restricted listings); ?abierto=1 now means abiertoTodos, other values ignored
      sinConfirmar: g('sinconfirmar') !== '0', // old ?sinconfirmar=1 = default (harmless)
      pais,
      ciudad: city ? city.slug : null,
      virtual: g('virtual') === '1' || (mods.includes('online') && !mods.includes('irl')),
      abiertoTodos: g('abierto') === '1',
    },
    sort: SORTS.some((s) => s.id === orden) ? orden! : 'cierra-pronto',
  };
}
export function filtersToSearch(f: Filters, sort: Sort): string {
  const p = new URLSearchParams();
  if (f.tipos.length !== ALL_TYPES.length) p.set('tipo', f.tipos.join(','));
  if (f.ecos.length) p.set('eco', f.ecos.map((e) => e.toLowerCase()).join(','));
  if (f.q) p.set('q', f.q);
  if (f.showClosed) p.set('cerradas', '1');
  if (f.pais) p.set('pais', f.pais.toLowerCase());
  if (f.ciudad) p.set('ciudad', f.ciudad);
  if (f.virtual) p.set('virtual', '1');
  if (f.abiertoTodos) p.set('abierto', '1');
  if (!f.sinConfirmar) p.set('sinconfirmar', '0');
  if (sort !== 'cierra-pronto') p.set('orden', sort);
  return p.toString();
}
