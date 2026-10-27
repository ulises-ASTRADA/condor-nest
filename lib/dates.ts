import type { Listing } from './types';
/** Date-only fields (raw->>'start_date' / 'end_date' / 'deadline_date', exposed as read-only generated columns) and
 *  "En curso" state. A date-only value is a published day with no published hour: it is shown as a day plus
 *  "Horario a confirmar" (event) / "Hora a confirmar" (close), never with an hour. The end-of-day instants below are
 *  used only to decide open/closed and ordering, and are never displayed. */
export const AR_TZ = 'America/Argentina/Cordoba'; // UTC-3 all year, no DST
type D = Pick<Listing, 'deadlineAt' | 'startsAt' | 'endsAt' | 'modality' | 'city'> & Partial<Pick<Listing, 'deadlineDate' | 'startDate' | 'endDate' | 'statusNote'>>;

const YMD = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
/** Valid YYYY-MM-DD (real calendar day) or null. */
export function ymdOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim(); const m = s.match(YMD); if (!m) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return d.getUTCDate() === +m[3] && d.getUTCMonth() + 1 === +m[2] ? s : null;
}
export const dayStartAr = (ymd: string) => new Date(`${ymd}T00:00:00-03:00`).toISOString();
export const dayEndAr = (ymd: string) => new Date(`${ymd}T23:59:59.999-03:00`).toISOString();
/** Calendar day (YYYY-MM-DD) of an instant in Córdoba time. */
export const ymdAr = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: AR_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const ymdParts = (ymd: string) => ymd.split('-').map(Number) as [number, number, number];
/** "31 de octubre" */
export const ymdLong = (ymd: string) => { const [, m, d] = ymdParts(ymd); return `${d} de ${MONTHS[m - 1]}`; };
/** "31 de octubre de 2026" */
export const ymdLongYear = (ymd: string) => `${ymdLong(ymd)} de ${ymdParts(ymd)[0]}`;
/** "31 oct" (home card) */
export const ymdShort = (ymd: string) => { const [, m, d] = ymdParts(ymd); return `${d} ${MON[m - 1]}`; };
/** "31/10" */
export const ymdDm = (ymd: string) => { const [, m, d] = ymdParts(ymd); return `${d}/${m}`; };
export const EVENT_TBC = 'Horario a confirmar';
export const CLOSE_TBC = 'Hora a confirmar';

/** Instants for open/closed logic and ordering only (never displayed). */
export const deadlineLogicIso = (l: D) => l.deadlineAt ?? (l.deadlineDate ? dayEndAr(l.deadlineDate) : null);
export const startLogicIso = (l: D) => l.startsAt ?? (l.startDate ? dayStartAr(l.startDate) : null);
export const endLogicIso = (l: D) => l.endsAt ?? (l.endDate ? dayEndAr(l.endDate) : null);

/** Started, with no registration close and no end published (e.g. Stranger Builds: "seven days online to ship", no date).
 *  Online: "En curso" until a close/end is loaded. In person: only until the end of the start day (Córdoba), then closed as before. */
export function isLive(l: D, now: Date): boolean {
  if (deadlineLogicIso(l) || endLogicIso(l)) return false;
  const s = startLogicIso(l); if (!s || new Date(s) > now) return false;
  if (l.modality === 'online') return true;
  return now.getTime() <= new Date(dayEndAr(l.startsAt ? ymdAr(l.startsAt) : l.startDate!)).getTime();
}
/** "En curso" or "En curso · <status_note from data>". */
export const liveLabel = (l: D) => (l.statusNote ? `En curso · ${l.statusNote}` : 'En curso');

/** Close shown in the organizer's local time for in-person listings in a known single-zone city; otherwise Argentina time. */
export const CITY_TZ: Record<string, { tz: string; label: string }> = {
  'Ciudad de México': { tz: 'America/Mexico_City', label: 'CDMX' }, 'Bogotá': { tz: 'America/Bogota', label: 'Bogotá' },
  'Lima': { tz: 'America/Lima', label: 'Lima' }, 'Santiago': { tz: 'America/Santiago', label: 'Santiago' },
};
export const closeZone = (l: D) => (l.modality !== 'online' && l.city && CITY_TZ[l.city]) || { tz: AR_TZ, label: 'Argentina' };
const fmtDay = (iso: string, tz: string) => new Intl.DateTimeFormat('es-AR', { timeZone: tz, day: 'numeric', month: 'long' }).format(new Date(iso));
const fmtHm = (iso: string, tz: string) => new Intl.DateTimeFormat('es-AR', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));

/** Registration close for page/title/description. day = "30 de octubre"; detail = ", 23:59 (hora de CDMX)" or null for date-only
 *  (then tbc = "Hora a confirmar"). null when there is no real close (never the event's start/end). */
export function closeDisplay(l: D): { day: string; detail: string | null; tbc: string | null } | null {
  if (l.deadlineAt) { const z = closeZone(l); return { day: fmtDay(l.deadlineAt, z.tz), detail: `, ${fmtHm(l.deadlineAt, z.tz)} (hora de ${z.label})`, tbc: null }; }
  if (l.deadlineDate) return { day: ymdLong(l.deadlineDate), detail: null, tbc: CLOSE_TBC };
  return null;
}
/** Plain-text close line, e.g. "Cierra el 30 de octubre, 23:59 (hora de CDMX)" / "Cierra el 1 de noviembre · Hora a confirmar". */
export function closeLine(l: D, open: boolean): string | null {
  const c = closeDisplay(l); if (!c) return null;
  return `${open ? 'Cierra' : 'Cerró'} el ${c.day}${c.detail ?? ''}${c.tbc ? ` · ${c.tbc}` : ''}`;
}
