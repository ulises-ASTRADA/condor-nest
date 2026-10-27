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
/** Offset (ms) of an IANA zone at an instant: local wall time − UTC. */
function tzOffsetMs(tz: string, ms: number): number {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
}
/** Instant of a local wall time (YYYY-MM-DD + h:m:s.ms) in an IANA zone (two passes, DST-safe). */
function wallToIso(ymd: string, tz: string, h: number, m: number, sec: number, ms: number): string {
  const [y, mo, d] = ymd.split('-').map(Number); const wall = Date.UTC(y, mo - 1, d, h, m, sec, ms);
  let t = wall - tzOffsetMs(tz, wall); t = wall - tzOffsetMs(tz, t);
  return new Date(t).toISOString();
}
export const dayStartIn = (ymd: string, tz: string) => wallToIso(ymd, tz, 0, 0, 0, 0);
export const dayEndIn = (ymd: string, tz: string) => wallToIso(ymd, tz, 23, 59, 59, 999);
export const dayStartAr = (ymd: string) => dayStartIn(ymd, AR_TZ);
export const dayEndAr = (ymd: string) => dayEndIn(ymd, AR_TZ);
/** Calendar day (YYYY-MM-DD) of an instant in a zone (default Córdoba). */
export const ymdIn = (iso: string, tz: string = AR_TZ) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
export const ymdAr = (iso: string) => ymdIn(iso, AR_TZ);

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

/** Zone that decides date-only days and "end of day": the event city's zone for in-person/hybrid listings in a known city,
 *  else Córdoba (online, or unknown city). */
export const logicTz = (l: D) => closeZone(l).tz;
/** Instants for open/closed logic and ordering only (never displayed). Date-only = start/end of that day in logicTz. */
export const deadlineLogicIso = (l: D) => l.deadlineAt ?? (l.deadlineDate ? dayEndIn(l.deadlineDate, logicTz(l)) : null);
export const startLogicIso = (l: D) => l.startsAt ?? (l.startDate ? dayStartIn(l.startDate, logicTz(l)) : null);
export const endLogicIso = (l: D) => l.endsAt ?? (l.endDate ? dayEndIn(l.endDate, logicTz(l)) : null);
/** Start day (YYYY-MM-DD) in logicTz, and 23:59:59 local of that day. */
export const startYmd = (l: D) => (l.startsAt ? ymdIn(l.startsAt, logicTz(l)) : l.startDate ?? null);
const startDayEndIso = (l: D) => { const d = startYmd(l); return d ? dayEndIn(d, logicTz(l)) : null; };

/** State of a listing with NO registration close (deadline_at / deadline_date), once it has started:
 *  - 'live'    green "En curso": until the published end (ends_at / end_date); with no end, until 23:59 local on the start day;
 *              with no end but a status_note from data (e.g. Stranger Builds), stays live (the note explains the end).
 *  - 'started' grey "Empezó el X · Fin a confirmar": no end, no note, after the start day. Never an unlimited green pill.
 *  - 'ended'   past the published end.
 *  null = has a registration close, or has not started (or no start). */
export type Phase = 'live' | 'started' | 'ended' | null;
export function phase(l: D, now: Date): Phase {
  if (deadlineLogicIso(l)) return null;
  const s = startLogicIso(l); if (!s || new Date(s) > now) return null;
  const end = endLogicIso(l);
  if (end) return now.getTime() <= new Date(end).getTime() ? 'live' : 'ended';
  if (l.statusNote) return 'live';
  return now.getTime() <= new Date(startDayEndIso(l)!).getTime() ? 'live' : 'started';
}
export const isLive = (l: D, now: Date) => phase(l, now) === 'live';
/** Open/closed. With a close: before it. Without: open until started, then 'live' is open, 'ended' closed, and 'started'
 *  (no end published) stays open online (shown "Fin a confirmar") but closes in person (after the start day, local time). */
export function isOpenAt(l: D, now: Date): boolean {
  const d = deadlineLogicIso(l); if (d) return new Date(d) > now;
  const p = phase(l, now);
  if (p === null || p === 'live') return true;
  if (p === 'ended') return false;
  return l.modality === 'online';
}
/** "En curso" or "En curso · <status_note from data>". */
export const liveLabel = (l: D) => (l.statusNote ? `En curso · ${l.statusNote}` : 'En curso');
export const END_TBC = 'Fin a confirmar';
/** "Empezó el 9 de noviembre · Fin a confirmar" (shown muted). */
export const startedLabel = (l: D) => { const d = startYmd(l); return d ? `Empezó el ${ymdLong(d)} · ${END_TBC}` : END_TBC; };

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
