import type { Listing } from './types';
import { ecosOf } from './eco';
import { DEFAULT_FILTERS, inCountry, isOpen, matches, openToArLatam, sortListings } from './rank';

export type Faq = { q: string; a: string };
export type Hub = {
  slug: string; label: string; h1: string; noun: [string, string]; // singular, plural
  where: string; feed: string; match: (l: Listing) => boolean; faqs: (n: number) => Faq[];
  iso?: string; // country hubs: listings restricted to this country count as open here
};

const UPDATED: Faq = { q: '¿Cada cuánto se actualiza esta lista?', a: 'Todos los días a la mañana (hora de Argentina) corre una carga automática desde Superteam Earn, Devpost y Taikai, y sumamos eventos curados de X y Luma después de verificarlos en su página oficial. La página se regenera sola con esos datos.' };
const FREE: Faq = { q: '¿Cuesta algo usar Condor Nest?', a: 'No. Ver las oportunidades es gratis y no hace falta crear una cuenta. Los espacios “Destacado” son pagos y siempre están marcados como tales.' };
const PUBLISH: Faq = { q: '¿Cómo publico mi evento acá?', a: 'Desde Condor Nest → “Publicá tu evento” (/publicar). Listamos gratis cualquier hackathon, bounty o grant abierto a builders de LatAm una vez que lo verificamos en su página oficial.' };
const ELIG: Faq = { q: '¿Cómo sé si puedo participar?', a: 'Cada tarjeta muestra la elegibilidad que publica la fuente oficial (país, LatAm o abierta). Nunca la inferimos: si la fuente no lo aclara, figura como “Elegibilidad sin confirmar”. Revisá siempre las bases en el link oficial.' };
const TZ: Faq = { q: '¿En qué horario están las fechas de cierre?', a: 'Las fechas y cuentas regresivas se muestran en la zona horaria de tu dispositivo, así no tenés que convertir horarios.' };

const country = (iso: string, name: string, slug: string): Hub => ({
  iso, slug, label: `Hackathons en ${name}`, h1: `Hackathons en ${name}`, noun: ['hackathon', 'hackathons'], where: `en ${name}`,
  feed: `/?tipo=hackathon&pais=${iso.toLowerCase()}`,
  match: (l) => l.type === 'hackathon' && inCountry(l, iso),
  faqs: () => [
    { q: `¿Qué hackathons hay abiertas en ${name}?`, a: `Arriba está la lista completa de hackathons abiertas que se hacen en ${name} o que están restringidas a participantes de ${name}, ordenadas por fecha de cierre.` },
    ELIG, UPDATED, TZ, PUBLISH,
  ],
});

export const HUBS: Hub[] = [
  country('AR', 'Argentina', 'hackathons-argentina'),
  country('MX', 'México', 'hackathons-mexico'),
  country('CL', 'Chile', 'hackathons-chile'),
  { slug: 'hackathons-ia', label: 'Hackathons de IA', h1: 'Hackathons de IA en LatAm', noun: ['hackathon de IA', 'hackathons de IA'], where: 'en LatAm', feed: '/?tipo=hackathon&eco=IA',
    match: (l) => l.type === 'hackathon' && ecosOf(l).includes('IA'),
    faqs: () => [
      { q: '¿Qué cuenta como hackathon de IA?', a: 'Las que en su fuente o descripción hablan de inteligencia artificial, agentes, LLMs o MCP. La clasificación sale de los datos reales del evento, no de una etiqueta puesta a mano.' },
      ELIG, UPDATED, TZ, PUBLISH,
    ] },
  { slug: 'bounties', label: 'Bounties', h1: 'Bounties para builders LatAm', noun: ['bounty', 'bounties'], where: 'para builders de LatAm', feed: '/?tipo=bounty',
    match: (l) => l.type === 'bounty',
    faqs: () => [
      { q: '¿Qué es un bounty?', a: 'Una tarea concreta (código, diseño, contenido) con un premio fijo que paga quien la publica. Se entrega online y gana la mejor entrega o todas las que cumplen, según las bases.' },
      { q: '¿De dónde salen estos bounties?', a: 'Principalmente de Superteam Earn, filtrados a los que están abiertos a LatAm o a un país de LatAm.' },
      ELIG, UPDATED, FREE,
    ] },
  { slug: 'grants', label: 'Grants', h1: 'Grants para builders LatAm', noun: ['grant', 'grants'], where: 'para builders de LatAm', feed: '/?tipo=grant',
    match: (l) => l.type === 'grant',
    faqs: () => [
      { q: '¿Qué es un grant?', a: 'Financiamiento no reembolsable para construir un proyecto. A diferencia de un hackathon, no compite en un evento con fecha: se postula con una propuesta.' },
      { q: '¿Qué grants lista Condor Nest?', a: 'Solo los que están abiertos explícitamente a LatAm o a un país de LatAm. No listamos convocatorias globales ni las que no aclaran desde dónde se puede participar.' },
      ELIG, UPDATED, PUBLISH,
    ] },
  { slug: 'hackathons-online', label: 'Hackathons online', h1: 'Hackathons online para LatAm', noun: ['hackathon online', 'hackathons online'], where: 'para participar desde LatAm', feed: '/?tipo=hackathon&modalidad=online',
    match: (l) => l.type === 'hackathon' && l.modality === 'online',
    faqs: () => [
      { q: '¿Puedo participar desde cualquier país?', a: 'Depende de cada una: algunas son online pero restringidas a un país. La etiqueta de elegibilidad de cada tarjeta lo indica según la fuente oficial.' },
      UPDATED, TZ, FREE, PUBLISH,
    ] },
];
export const hubBySlug = (s: string) => HUBS.find((h) => h.slug === s) ?? null;
/** Same "abierto" definition as the home feed's default chip: open, and open to AR/LatAm (country hubs also accept their own country). */
const eligibleHere = (h: Hub, l: Listing) => openToArLatam(l) || (!!h.iso && l.country === h.iso);
export const hubItems = (h: Hub, all: Listing[], now: Date) => sortListings(all.filter((l) => h.match(l) && isOpen(l, now) && eligibleHere(h, l) && l.eligibility !== 'unknown'), 'cierra-pronto', now);
/** Open, but with eligibility not confirmed by the source: shown separately and labeled. */
export const hubUnconfirmed = (h: Hub, all: Listing[], now: Date) => sortListings(all.filter((l) => h.match(l) && isOpen(l, now) && l.eligibility === 'unknown'), 'cierra-pronto', now);
/** Open but restricted to another country (excluded from the hub, counted for transparency). */
export const hubRestricted = (h: Hub, all: Listing[], now: Date) => all.filter((l) => h.match(l) && isOpen(l, now) && !eligibleHere(h, l) && l.eligibility !== 'unknown');
/** What the home feed shows for ?pais=<iso> with default filters (all types). */
export const countryFeedCount = (iso: string, all: Listing[], now: Date) => all.filter((l) => matches(l, { ...DEFAULT_FILTERS, pais: iso }, now)).length;
/** Most specific hubs for a listing (for links from /o pages). */
export const hubsFor = (l: Listing) => HUBS.filter((h) => h.match(l));
export const monthYear = (d: Date) => new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', month: 'long', year: 'numeric' }).format(d).replace(' de ', ' ');

/** 'octubre de 2026' in Córdoba time, for dated answer sentences. */
export const monthDeYear = (d: Date) => new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Cordoba', month: 'long', year: 'numeric' }).format(d);
