import type { Listing } from './types';
import { TYPE_LABEL } from './format';
import { effDeadline, isOpen } from './rank';
import { HUBS, type Hub, hubBySlug, hubOrder, shortName } from './hubs';

/** <title>s aim for ~60 chars before " | Condor Nest"; meta descriptions for ≤155. */
export const TITLE_MAX = 60;
export const DESC_MAX = 155;
export const BRAND = ' | Condor Nest';
const AR = 'America/Argentina/Cordoba';
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const yearOf = (iso: string) => new Intl.DateTimeFormat('es-AR', { timeZone: AR, year: 'numeric' }).format(new Date(iso));
const KIND_RE: Record<Listing['type'], RegExp> = { hackathon: /hack(a|e)?t(h)?[oó]n/i, bounty: /bount(y|ies)|recompensa/i, grant: /grant|subsidio|beca|fondo/i };

/** Greedy: keep whole parts, in priority order, while the joined result stays ≤ max. */
export function fit(parts: (string | null | undefined | false)[], sep: string, max: number): string {
  let out = '';
  for (const p of parts) {
    if (!p) continue;
    const next = out ? `${out}${sep}${p}` : p;
    if (next.length <= max) out = next;
  }
  return out;
}

/** "shippear #3: hackatón de un día en Rosario" → "Shippear #3 Hackathon Rosario 2026": the name before any ":",
 *  plus the kind (Hackathon/Bounty/Grant) when the name doesn't say it, the city (in-person) and the year, from real data only. */
export function listingName(l: Pick<Listing, 'type' | 'title' | 'city' | 'modality' | 'startsAt' | 'deadlineAt' | 'endsAt'>): string {
  const full = l.title.trim().replace(/\s+/g, ' ');
  let head = full.split(/:\s/)[0].trim();
  if (head.length < 4) head = full;
  head = head.replace(/[\s,–—-]+$/, '');
  head = head[0].toUpperCase() + head.slice(1);
  // A trailing year moves to the end, after kind and city ("X 2026" → "X Hackathon Rosario 2026").
  const trailing = head.match(/[\s·,–—-]+(20\d{2})$/); if (trailing) head = head.slice(0, -trailing[0].length);
  if (!KIND_RE[l.type].test(head)) head = l.type === 'hackathon' ? `${head} Hackathon` : `${TYPE_LABEL[l.type]}: ${head}`;
  if (l.city && l.modality !== 'online' && !fold(head).includes(fold(l.city))) head = `${head} ${l.city}`;
  const when = l.startsAt ?? l.deadlineAt ?? l.endsAt;
  const year = trailing?.[1] ?? (when ? yearOf(when) : null);
  if (year && !/\b20\d{2}\b/.test(head)) head = `${head} ${year}`;
  return head;
}

/** The event itself is over (not just registration): last known date (end, else start, else deadline) is past. */
export function isFinished(l: Pick<Listing, 'startsAt' | 'endsAt' | 'deadlineAt'>, now: Date): boolean {
  const last = l.endsAt ?? l.startsAt ?? l.deadlineAt;
  return !!last && new Date(last).getTime() < now.getTime();
}
export type ListingState = 'open' | 'regClosed' | 'finished';
export const listingState = (l: Listing, now: Date): ListingState => (isOpen(l, now) ? 'open' : isFinished(l, now) ? 'finished' : 'regClosed');

/** Access hint for the title: "online" or "abierto a LatAm" (hackathon/bounty/grant are masculine in our copy). */
export const accessHint = (l: Pick<Listing, 'modality' | 'eligibility'>): string | null =>
  l.modality === 'online' ? 'online' : l.eligibility === 'latam' ? 'abierto a LatAm' : null;

/** Listing <title>: name + (open) published prize, close date, online/LatAm, or (closed) "finalizada"/"inscripción cerrada". */
export function listingTitle(l: Listing, o: { now: Date; prize: string | null; date: string | null }): string {
  const name = listingName(l);
  const st = listingState(l, o.now);
  const prize = o.prize && (/premio/i.test(o.prize) ? o.prize : `premio ${o.prize}`);
  const tail = st === 'open' ? [prize, o.date, accessHint(l)] : [st === 'finished' ? 'finalizada' : 'inscripción cerrada', prize];
  let core = name;
  for (const p of tail) {
    if (!p) continue;
    const next = `${core}${core === name ? ' — ' : ', '}${p}`;
    if (next.length <= TITLE_MAX) core = next;
  }
  if (st !== 'open' && core === name) core = `${name} — ${tail[0]}`; // the closed state always shows
  return `${core}${BRAND}`;
}

/** Hub where a finished listing points people next: its country hub (hackathons), else its type hub (bounties/grants). */
export function nextHub(l: Listing): Hub | null {
  return HUBS.find((h) => h.iso && h.match(l)) ?? (l.type === 'hackathon' ? null : hubBySlug(l.type === 'bounty' ? 'bounties' : 'grants'));
}
/** Link text to that hub's open listings, with the real count; never "0 abiertos". */
export function nextHubText(h: Hub, n: number): string {
  return n > 0 ? `${n === 1 ? `el ${h.noun[0]} abierto` : `los ${n} ${h.noun[1]} abiertos`} ${h.where}` : `${h.noun[1]} ${h.where}`;
}

/** Listing meta description (≤155, whole sentences). Finished: starts with "Convocatoria finalizada." and ends pointing to the hub. */
export function listingDescription(parts: (string | null)[], st: ListingState, hubLine: string | null): string {
  const lead = st === 'finished' ? 'Convocatoria finalizada.' : st === 'regClosed' ? 'Inscripción cerrada.' : null;
  const [first, ...rest] = parts.filter(Boolean) as string[];
  // State + what it is always go first; the hub link is kept at the end; the rest fills what's left.
  const head = fit([lead, first], ' ', DESC_MAX);
  const end = hubLine && `${head} ${hubLine}`.length <= DESC_MAX ? ` ${hubLine}` : '';
  const d = fit([head, ...rest], ' ', DESC_MAX - end.length) + end;
  return d.trim() || first.slice(0, DESC_MAX - 1).replace(/\s+\S*$/, '') + '…';
}

/** Hub <title>: "Hackathons en Argentina 2026: 5 abiertos, premios y cierres". n=1 → "1 abierto"; n=0 never says "0". */
export function hubTitle(h: Hub, n: number, regionalN: number, now: Date): string {
  const base = `${h.h1} ${yearOf(now.toISOString())}`;
  const options = n > 0
    ? [`${base}: ${n} ${n === 1 ? 'abierto' : 'abiertos'}, premios y cierres`, `${base}: ${n} ${n === 1 ? 'abierto' : 'abiertos'}`]
    : h.iso && regionalN > 0
      ? [`${base}: abiertos a LatAm, premios y cierres`, `${base}: abiertos a LatAm`]
      : [`${base}: premios y cierres`, base];
  return `${options.find((t) => t.length <= TITLE_MAX) ?? options[options.length - 1]}${BRAND}`;
}

/** Hub meta description from real counts; ≤155, whole sentences. */
export function hubDescription(h: Hub, n: number, regionalN: number, order: 'inicio' | 'cierre', next: { title: string; date: string } | null): string {
  const count = n > 0
    ? `${n} ${n === 1 ? h.noun[0] : h.noun[1]} ${n === 1 ? 'abierto' : 'abiertos'} ${h.where}.`
    : h.iso && regionalN > 0 ? `Hoy no hay ${h.noun[1]} abiertos solo ${h.where}: te mostramos ${regionalN} ${regionalN === 1 ? 'abierto' : 'abiertos'} a LatAm.` : `${h.noun[1][0].toUpperCase()}${h.noun[1].slice(1)} ${h.where}.`;
  const nextLine = next ? `${order === 'cierre' ? 'El próximo cierre' : 'El próximo'}: ${next.title} (${next.date}).` : null;
  return fit([count, `Premio, elegibilidad y fecha de ${order} en tu hora.`, nextLine, 'Actualizado todos los días.'], ' ', DESC_MAX);
}

const dm = (iso: string) => new Intl.DateTimeFormat('es-AR', { timeZone: AR, day: 'numeric', month: 'numeric' }).format(new Date(iso));
/** First listing of the hub (already sorted by the hub's order) as { title, date } for the description, or null. */
export function hubNext(h: Hub, items: Listing[]): { title: string; date: string } | null {
  const l = items[0]; if (!l) return null;
  const iso = hubOrder(h) === 'cierre' ? effDeadline(l) : l.startsAt ?? effDeadline(l);
  return iso ? { title: shortName(l), date: dm(iso) } : null;
}
