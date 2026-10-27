import type { Listing } from './types';
import { ecosOf } from './eco';
import { normCity } from './city';
import { startLogicIso, ymdDm } from './dates';
import { DEFAULT_FILTERS, effDeadline, inCountry, isOpen, matches, openToArLatam, sortListings } from './rank';

export type Faq = { q: string; a: string };
export type Hub = {
  slug: string; label: string; h1: string; noun: [string, string]; // singular, plural
  where: string; feed: string; match: (l: Listing) => boolean; faqs: (n: number, items: Listing[], now: Date, all: Listing[]) => Faq[];
  iso?: string; // country hubs: listings restricted to this country count as open here
  cities?: string[]; // country hubs: cities that always get their own section (with an honest empty state)
};
/** Hackathon hubs list by start date (the date the card shows for in-person events); bounties/grants by deadline. */
export const hubOrder = (h: Hub): 'inicio' | 'cierre' => (h.slug === 'bounties' || h.slug === 'grants' ? 'cierre' : 'inicio');
const tms = (iso: string | null) => (iso ? new Date(iso).getTime() : Infinity);
const startKey = (l: Listing) => startLogicIso(l) ?? effDeadline(l);
const sortHub = (h: Hub, list: Listing[], now: Date) => hubOrder(h) === 'cierre' ? sortListings(list, 'cierra-pronto', now) : [...list].sort((x, y) => tms(startKey(x)) - tms(startKey(y)));

const UPDATED: Faq = { q: '¿Cada cuánto se actualiza esta lista?', a: 'Todos los días a las 8 (hora de Argentina) corre una carga automática desde Superteam Earn, Devpost y Taikai, y sumamos eventos curados de X y Luma después de verificarlos en su página oficial. La página se regenera sola con esos datos.' };
const FREE: Faq = { q: '¿Cuesta algo usar Condor Nest?', a: 'No. Ver las oportunidades es gratis y no hace falta crear una cuenta. Los espacios “Destacado” son pagos y siempre están marcados como tales.' };
const PUBLISH: Faq = { q: '¿Cómo publico mi evento acá?', a: 'Desde Condor Nest → “Publicá tu evento” (/publicar). Listamos gratis cualquier hackathon, bounty o grant abierto a builders de LatAm una vez que lo verificamos en su página oficial.' };
const ELIG: Faq = { q: '¿Cómo sé si puedo participar?', a: 'Cada tarjeta muestra la elegibilidad que publica la fuente oficial (país, LatAm o abierta). Nunca la inferimos: si la fuente no lo aclara, figura como “Elegibilidad sin confirmar”. Revisá siempre las bases en el link oficial.' };
const TZ: Faq = { q: '¿En qué horario están las fechas?', a: 'En la zona horaria de tu dispositivo, así no tenés que convertir horarios. Cada fecha muestra su zona al lado (por ejemplo, GMT-3). Si tu navegador no informa una zona, las mostramos en hora de Córdoba (GMT-3), la misma de todo el país.' };

const country = (iso: string, name: string, slug: string, cities?: string[]): Hub => ({
  iso, slug, cities, label: `Hackathons en ${name}`, h1: `Hackathons en ${name}`, noun: ['hackathon', 'hackathons'], where: `en ${name}`,
  feed: `/?tipo=hackathon&pais=${iso.toLowerCase()}`,
  match: (l) => l.type === 'hackathon' && inCountry(l, iso),
  faqs(_n, items, now, all) {
    if (cities?.length) return richCountryFaqs(this, name, items, now, all);
    return [
      { q: `¿Qué hackathons hay abiertos en ${name}?`, a: `${answerLine(this, items, now)} Son los que se hacen en ${name} o están restringidos a participantes de ${name}.` },
      ELIG, UPDATED, TZ, PUBLISH,
    ];
  },
});

export const HUBS: Hub[] = [
  country('AR', 'Argentina', 'hackathons-argentina', ['Buenos Aires', 'Córdoba', 'Rosario']),
  country('MX', 'México', 'hackathons-mexico'),
  country('CL', 'Chile', 'hackathons-chile'),
  { slug: 'hackathons-ia', label: 'Hackathons de IA', h1: 'Hackathons de IA en LatAm', noun: ['hackathon de IA', 'hackathons de IA'], where: 'en LatAm', feed: '/?tipo=hackathon&eco=IA',
    match: (l) => l.type === 'hackathon' && ecosOf(l).includes('IA'),
    faqs: () => [
      { q: '¿Qué cuenta como hackathon de IA?', a: 'Las que en su fuente o descripción hablan de inteligencia artificial, agentes, LLMs o MCP. La clasificación sale de los datos reales del evento, no de una etiqueta puesta a mano.' },
      ELIG, UPDATED, TZ, PUBLISH,
    ] },
  { slug: 'bounties', label: 'Bounties', h1: 'Bounties para builders de LatAm', noun: ['bounty', 'bounties'], where: 'para builders de LatAm', feed: '/?tipo=bounty',
    match: (l) => l.type === 'bounty',
    faqs: () => [
      { q: '¿Qué es un bounty?', a: 'Una tarea concreta (código, diseño, contenido) con un premio fijo que paga quien la publica. Se entrega online y gana la mejor entrega o todas las que cumplen, según las bases.' },
      { q: '¿De dónde salen estos bounties?', a: 'Principalmente de Superteam Earn, filtrados a los que están abiertos a LatAm o a un país de LatAm.' },
      ELIG, UPDATED, FREE,
    ] },
  { slug: 'grants', label: 'Grants', h1: 'Grants para builders de LatAm', noun: ['grant', 'grants'], where: 'para builders de LatAm', feed: '/?tipo=grant',
    match: (l) => l.type === 'grant',
    faqs: () => [
      { q: '¿Qué es un grant?', a: 'Financiamiento no reembolsable para construir un proyecto. A diferencia de un hackathon, no compite en un evento con fecha: se postula con una propuesta.' },
      { q: '¿Qué grants lista Condor Nest?', a: 'Los que están abiertos explícitamente a LatAm o a un país de LatAm. También listamos convocatorias globales abiertas a participantes de Latinoamérica. No listamos las que no aclaran desde dónde se puede participar.' },
      ELIG, UPDATED, PUBLISH,
    ] },
  { slug: 'hackathons-online', label: 'Hackathons online', h1: 'Hackathons online para LatAm', noun: ['hackathon online', 'hackathons online'], where: 'para participar desde LatAm', feed: '/?tipo=hackathon&virtual=1',
    match: (l) => l.type === 'hackathon' && l.modality === 'online',
    faqs: () => [
      { q: '¿Puedo participar desde cualquier país?', a: 'Depende de cada uno: algunos son online pero restringidos a un país. La etiqueta de elegibilidad de cada tarjeta lo indica según la fuente oficial.' },
      UPDATED, TZ, FREE, PUBLISH,
    ] },
];
export const hubBySlug = (s: string) => HUBS.find((h) => h.slug === s) ?? null;
/** Same "abierto" definition as the home feed's default chip: open, and open to AR/LatAm (country hubs also accept their own country). */
const eligibleHere = (h: Hub, l: Listing) => openToArLatam(l) || (!!h.iso && l.country === h.iso);
export const hubItems = (h: Hub, all: Listing[], now: Date) => sortHub(h, all.filter((l) => h.match(l) && isOpen(l, now) && eligibleHere(h, l) && l.eligibility !== 'unknown'), now);
/** Open, but with eligibility not confirmed by the source: shown separately and labeled. */
export const hubUnconfirmed = (h: Hub, all: Listing[], now: Date) => sortHub(h, all.filter((l) => h.match(l) && isOpen(l, now) && l.eligibility === 'unknown'), now);
/** Open but restricted to another country (excluded from the hub, counted for transparency). */
export const hubRestricted = (h: Hub, all: Listing[], now: Date) => all.filter((l) => h.match(l) && isOpen(l, now) && !eligibleHere(h, l) && l.eligibility !== 'unknown');
/** Country hub with 0 country-specific open hackathons: the ones the feed shows for this country (open to all LatAm or online). */
export const hubRegional = (h: Hub, all: Listing[], now: Date): Listing[] => !h.iso || hubItems(h, all, now).length > 0 ? [] :
  sortListings(all.filter((l) => matches(l, { ...DEFAULT_FILTERS, tipos: ['hackathon'], pais: h.iso! }, now) && !inCountry(l, h.iso!)), 'cierra-pronto', now);
/** h1 + <title>/og:title. Never "0 abiertos": with no specific ones it says "y abiertos a LatAm" (regional cards shown) or drops the number. */
export function hubHeading(h: Hub, n: number, regionalN: number, m: string): { h1: string; title: string } {
  if (n === 0 && h.iso && regionalN > 0) { const h1 = `${h.h1} y abiertos a LatAm`; return { h1, title: `${h1} (${m}) | Condor Nest` }; }
  if (n === 0) return { h1: h.h1, title: `${h.h1} (${m}) | Condor Nest` };
  return { h1: h.h1, title: `${h.h1} (${m}): ${n} ${n === 1 ? 'abierto' : 'abiertos'} | Condor Nest` };
}
/** What the home feed shows for ?pais=<iso> with default filters (all types). */
export const countryFeedCount = (iso: string, all: Listing[], now: Date) => all.filter((l) => matches(l, { ...DEFAULT_FILTERS, pais: iso }, now)).length;
/** Most specific hubs for a listing (for links from /o pages). */
export const hubsFor = (l: Listing) => HUBS.filter((h) => h.match(l));
export const monthYear = (d: Date) => new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', month: 'long', year: 'numeric' }).format(d).replace(' de ', ' ');

/** 'octubre de 2026' in Córdoba time, for dated answer sentences. */
export const monthDeYear = (d: Date) => new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Cordoba', month: 'long', year: 'numeric' }).format(d);

const dm = (iso: string) => new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Cordoba', day: 'numeric', month: 'numeric' }).format(new Date(iso));
const dmy = (d: Date) => new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Cordoba', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Short display name derived from the DB title only (no new facts): text before ':', "A · B" → "A de B",
 *  minus a leading "Hackathon/Hackatón", a trailing year and a trailing city that repeats the DB city. Falls back to the title. */
export function shortName(l: Listing): string {
  let t = l.title.split(':')[0].trim();
  t = t.replace(/\s+(19|20)\d{2}$/, '').trim();
  t = t.replace(/^hackat(h)?[oó]n\s+/i, '').trim();
  if (l.city) t = t.replace(new RegExp(`\\s+(en\\s+)?${esc(l.city)}$`, 'i'), '').trim();
  t = t.replace(/\s+·\s+/g, ' de ');
  return t.length >= 3 ? t : l.title;
}
/** "(Buenos Aires, 7/11, Digital House)": city (optional), start date, venue, only when the DB has them. */
export const refDetails = (l: Listing, { city = true, venue = false } = {}) => {
  const bits = [city ? (l.modality !== 'online' ? l.city : 'online') : null, l.startsAt ? dm(l.startsAt) : l.startDate ? ymdDm(l.startDate) : null, venue && l.modality !== 'online' ? l.venue : null].filter(Boolean);
  return bits.length ? ` (${bits.join(', ')})` : '';
};
export const startDm = (l: Listing) => (l.startsAt ? dm(l.startsAt) : l.startDate ? ymdDm(l.startDate) : null);
export const shortRef = (l: Listing) => `${shortName(l)}${refDetails(l)}`;
export const joinY = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);
/** Pieces of the self-contained answer ("Al 20/10/2026 hay 5 hackathons abiertos en Argentina, todos presenciales: …"). Up to 5 named; more → 3 + "y N más". */
export function answerParts(h: Hub, items: Listing[], now: Date): { lead: string; named: Listing[]; more: number } {
  const n = items.length;
  if (!n) return { lead: `Al ${dmy(now)} no hay ${h.noun[1]} abiertos ${h.where}.`, named: [], more: 0 };
  const named = n > 5 ? items.slice(0, 3) : items;
  const irl = items.filter((l) => l.modality !== 'online').length;
  const all = irl === n && n > 1 ? ', todos presenciales' : '';
  return { lead: `Al ${dmy(now)} hay ${n} ${n === 1 ? h.noun[0] : h.noun[1]} ${n === 1 ? 'abierto' : 'abiertos'} ${h.where}${all}: `, named, more: n > 5 ? n - 3 : 0 };
}
export function answerLine(h: Hub, items: Listing[], now: Date): string {
  const { lead, named, more } = answerParts(h, items, now);
  if (!named.length) return lead;
  return `${lead}${joinY([...named.map(shortRef), ...(more ? [`${more} más`] : [])])}.`;
}
const STUDENT_ONLY = /^solo estudiantes/i;
export const studentOnly = (l: Listing) => STUDENT_ONLY.test(l.eligibilityShort ?? '') || STUDENT_ONLY.test(l.eligibilityNote ?? '');
/** In-person items grouped by DB city: pinned cities (even if empty) plus any other city present; cities with events first. */
export function cityGroups(h: Hub, items: Listing[]): { city: string; items: Listing[]; pinned: boolean }[] {
  const irl = items.filter((l) => l.modality !== 'online' && l.city);
  const pinned = (h.cities ?? []).map((c) => ({ city: c, pinned: true, items: irl.filter((l) => normCity(l.city!) === normCity(c)) }));
  const seen = new Set((h.cities ?? []).map(normCity));
  const others = new Map<string, Listing[]>();
  for (const l of irl) { const k = normCity(l.city!); if (seen.has(k)) continue; if (!others.has(l.city!)) others.set(l.city!, []); others.get(l.city!)!.push(l); }
  const groups = [...pinned, ...[...others].map(([city, xs]) => ({ city, items: xs, pinned: false }))];
  return [...groups.filter((g) => g.items.length), ...groups.filter((g) => !g.items.length)]; // cities with events first, empty pinned ones last
}

const NO_CODE = /no hace falta (saber codear|saber programar|experiencia previa)/i;
const TEAM_ON_SITE = /(armar equipo|se arman en el lugar|arma \d+ equipos|te ayudan a armar|pod[eé]s ir solo|te sum[aá]s solo|no hace falta llegar con equipo)/i;
const FREE_RE = /\b(gratis|gratuit[oa])\b/i;
const freeText = (l: Listing) => [l.eligibilityShort, l.eligibilityNote].filter(Boolean).join(' ');
const ref = (l: Listing) => `${shortName(l)}${refDetails(l)}`;
const names = (xs: Listing[]) => joinY(xs.map(shortName));
/** Brief §7 FAQs (country hubs with pinned cities). Dynamic answers are built only from listing data; they regenerate with the page. */
function richCountryFaqs(h: Hub, name: string, items: Listing[], now: Date, all: Listing[]): Faq[] {
  const n = items.length;
  const groups = cityGroups(h, items);
  const withEv = groups.filter((g) => g.items.length); const empty = groups.filter((g) => !g.items.length);
  const cityBits = withEv.map((g) => `en ${g.city} ${g.items.length === 1 ? 'hay 1 abierto' : `hay ${g.items.length} abiertos`} (${g.items.length === 1 ? '' : 'el próximo es '}${shortName(g.items[0])}${startDm(g.items[0]) ? `, ${startDm(g.items[0])}` : ''})`);
  const emptyBit = empty.length ? ` ${empty.length === 1 ? `En ${empty[0].city}` : `En ${joinY(empty.map((g) => g.city))}`} no hay ninguno abierto hoy; los sumamos apenas se publican y se verifican, y te podés enterar por el newsletter de los lunes.` : '';
  const q2 = `${cityBits.length ? `Al ${dmy(now)}, ${joinY(cityBits)}.` : `Al ${dmy(now)} no hay hackathons abiertos en ${joinY(groups.map((g) => g.city))}.`}${emptyBit}`;
  const st = items.filter(studentOnly);
  const q3 = `${st.length ? `Sí: ${joinY(st.map(ref))} ${st.length === 1 ? 'es' : 'son'} solo para estudiantes.` : `Hoy ninguno de los abiertos en ${name} es solo para estudiantes.`} Otros también los aceptan: la elegibilidad de cada tarjeta sale de la fuente oficial, así que fijate quién puede participar en cada uno.`;
  const online = HUBS.find((x) => x.slug === 'hackathons-online');
  const onlineN = online ? hubItems(online, all, now).length : 0;
  const q4 = `Sí. Los online que aceptan participantes de ${name} o de LatAm, incluidas convocatorias globales abiertas a participantes de Latinoamérica, están en [Hackathons online](/hackathons-online) (${onlineN === 1 ? '1 abierto' : `${onlineN} abiertos`} hoy).`;
  const noCode = items.filter((l) => NO_CODE.test(l.eligibilityNote ?? ''));
  const team = items.filter((l) => TEAM_ON_SITE.test(l.eligibilityNote ?? ''));
  const q5 = `Depende de cada evento y está en sus bases oficiales. Varios aceptan perfiles de diseño, negocio o estudiantes, y en muchos los equipos se arman ahí mismo.${noCode.length ? ` Según sus fichas, ${names(noCode)} ${noCode.length === 1 ? 'indica' : 'indican'} que no hace falta saber programar o tener experiencia previa.` : ''}${team.length ? ` En ${names(team)} podés ir sin equipo y armarlo en el lugar.` : ''}`;
  const free = items.filter((l) => FREE_RE.test(freeText(l)));
  const q6 = n === 0 ? 'Depende de cada evento: revisá la ficha y las bases oficiales.'
    : free.length ? `De los ${n} abiertos hoy, ${free.length} ${free.length === 1 ? 'indica' : 'indican'} en su ficha que ${free.length === 1 ? 'es gratis' : 'son gratis'} (${names(free)}).${free.length < n ? ' Para el resto, revisá la ficha de cada uno: si la fuente no publica el costo, no lo damos por hecho.' : ''}`
    : 'Ninguno de los abiertos hoy publica el costo en su ficha. Revisá las bases oficiales de cada uno antes de inscribirte.';
  return [
    { q: `¿Qué hackathons hay abiertos en ${name} ahora?`, a: answerLine(h, items, now) },
    { q: `¿Hay hackathons en ${joinY(h.cities ?? []).replace(/ y ([^ ]+)$/, ' o $1')}?`, a: q2 },
    { q: `¿Hay hackathons para estudiantes en ${name}?`, a: q3 },
    { q: `¿Puedo participar en hackathons online desde ${name}?`, a: q4 },
    { q: '¿Tengo que saber programar o tener equipo?', a: q5 },
    { q: '¿Cuánto cuesta participar?', a: q6 },
    { q: '¿Cada cuánto se actualiza y de dónde salen los datos?', a: UPDATED.a },
    { q: '¿Cómo publico mi hackathon?', a: 'Desde “Publicá tu evento” (/publicar). Listamos gratis cualquier hackathon abierto a builders de LatAm una vez que lo verificamos en su página oficial. También ofrecemos espacios Destacado, que son pagos y siempre están marcados como tales (ver [Transparencia](/acerca#divulgacion)).' },
    TZ,
  ];
}
/** "Digital House · Belgrano": DB venue plus the last part of venue_locality (neighborhood), when present. */
export function venueLine(l: Listing): string | null {
  if (l.modality === 'online' || !l.venue) return null;
  const hood = l.venueLocality?.split(',').pop()?.trim() || null;
  return hood && !l.venue.toLowerCase().includes(hood.toLowerCase()) ? `${l.venue} · ${hood}` : l.venue;
}
/** Venue lines for one list: every item's venueLine only when ALL items have one in the DB, otherwise none (a lone venue reads as a glitch). Never invents a venue. */
export function venueLines(items: Listing[]): (string | null)[] {
  const v = items.map(venueLine);
  return v.every(Boolean) ? v : v.map(() => null);
}
