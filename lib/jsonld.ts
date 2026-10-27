import { safeHttpsUrl, type Listing } from './types';
import { SITE } from './site';
import { COUNTRY_ES } from './geo';
import type { OrgAbout } from './organizer';
import { access } from './rank';
import type { Venue } from './venues';
import { deadlineLogicIso, endLogicIso, isOpenAt, startLogicIso } from './dates';

const PLATFORMS = /(^|\.)(luma\.com|lu\.ma|devpost\.com|taikai\.network|eventtia\.com|eventbrite\.[a-z.]+|microsoft\.com|typeform\.com|x\.com|twitter\.com|superteam\.fun|earn\.superteam\.fun|forms\.gle|google\.com|notion\.site|dorahacks\.io)$/i;
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
const siteOf = (u: string | null) => { try { const x = u ? new URL(u) : null; return x && !PLATFORMS.test(x.hostname) ? x.origin : null; } catch { return null; } };
/** Real organizer URL, never a generic platform: own site (verified page, else source page), else the X profile
 *  that posted the source when its handle matches an organizer name; otherwise null (url omitted). */
const orgUrl = (l: Listing) => {
  const site = siteOf(l.verifiedUrl) ?? siteOf(l.sourceUrl);
  if (site) return site;
  const h = l.sourcePostUrl?.match(/^https:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/status\//)?.[1];
  if (h && l.organizer) {
    const hn = norm(h);
    if (l.organizer.split(/[·,&/]| y | and /).map(norm).some((o) => o.length >= 4 && (o.startsWith(hn) || hn.startsWith(o)))) return `https://x.com/${h}`;
  }
  return null;
};
const officialUrl = (l: Listing) => l.verifiedUrl ?? l.applyUrl ?? l.sourceUrl ?? null;
export const ORG = {
  '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Condor Nest', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/icon.svg` }, image: `${SITE}/opengraph-image`,
  areaServed: 'Latinoamérica', foundingLocation: { '@type': 'Place', name: 'Córdoba, Argentina' },
  sameAs: ['https://x.com/CondorNestLatam'],
};
export const WEBSITE = { '@type': 'WebSite', '@id': `${SITE}/#website`, name: 'Condor Nest', url: SITE, inLanguage: 'es-AR', publisher: { '@id': `${SITE}/#org` } };

/** Place from DB fields only. addressLocality is the city (venue_locality holds a street or neighborhood, not a locality);
 *  streetAddress is venue_locality only when it carries a street number (e.g. "Monroe 860, Belgrano"), never a bare neighborhood.
 *  No geo: the DB has no coordinates, so none are emitted. Nulls omitted. */
export function placeLd(l: Listing): Record<string, unknown> | null {
  if (!l.city && !l.venue) return null;
  const country = l.country && COUNTRY_ES[l.country] ? l.country : null;
  const street = l.venue && l.venueLocality && /\d/.test(l.venueLocality) ? l.venueLocality.trim() : null;
  const address = street || l.city || country ? { '@type': 'PostalAddress', ...(street ? { streetAddress: street } : {}), ...(l.city ? { addressLocality: l.city } : {}), ...(country ? { addressCountry: country } : {}) } : null;
  return { '@type': 'Place', name: l.venue ?? l.city, ...(address ? { address } : {}) };
}
/** One Place per day for multi-venue events (raw.venues), each with its own PostalAddress. */
export function venuePlacesLd(l: Listing, venues: Venue[]): Record<string, unknown>[] {
  const country = l.country && COUNTRY_ES[l.country] ? l.country : null;
  return venues.map((v) => ({ '@type': 'Place', name: v.name, address: { '@type': 'PostalAddress', streetAddress: v.street, addressLocality: v.locality, ...(country ? { addressCountry: country } : {}) } }));
}
const mode = (l: Listing) => `https://schema.org/${l.modality === 'online' ? 'Online' : l.modality === 'hybrid' ? 'Mixed' : 'Offline'}EventAttendanceMode`;
/** One sentence on who can take part, from the same rule as the card tag; null when eligibility is unknown (omitted). */
export function accessSentence(l: Listing): string | null {
  const a = access(l);
  if (a === 'todos') return `${l.eligibility === 'latam' ? 'Abierto a participantes de Latinoamérica' : 'Abierto a todos'}, sin requisitos de edad ni de estudios publicados por la organización.`;
  if (a === 'requisitos') { const d = (l.eligibilityShort ?? l.eligibilityNote ?? '').trim().replace(/[.]$/, ''); return d ? `Tiene requisitos para participar (${d}).` : 'Tiene requisitos para participar.'; }
  return null;
}
const withAccess = (d: string | null, l: Listing) => [d, accessSentence(l)].filter(Boolean).join(' ') || null;
/** Event schema from real listing data only; null when there is no start date to anchor an Event. */
export function eventLd(l: Listing, about?: OrgAbout | null, now?: Date, venues?: Venue[] | null): Record<string, unknown> | null {
  // startDate/endDate: full timestamp when published, else the plain published day ("2026-10-31"); never an invented hour.
  const start = l.startsAt ?? l.startDate;
  if (!start) return null;
  const end = l.endsAt ?? l.endDate;
  const online = l.modality === 'online';
  // VirtualLocation url = the listing's official page (source_url, else apply_url), https only. No usable URL = no
  // VirtualLocation (never a null url). An online or hybrid listing with no venue gets the VirtualLocation alone,
  // so `location` is never missing or null when there is something real to point at.
  const virtUrl = safeHttpsUrl(l.sourceUrl) ?? safeHttpsUrl(l.applyUrl);
  const virt = virtUrl ? { '@type': 'VirtualLocation', url: virtUrl } : null;
  const multi = !online && venues && venues.length >= 2 ? venuePlacesLd(l, venues) : null;
  const place = online || multi ? null : placeLd(l);
  const physical = multi ?? (place ? [place] : []);
  const parts = l.modality === 'online' ? [virt] : l.modality === 'hybrid' ? [...physical, virt] : physical;
  const locs = parts.filter((x): x is Record<string, unknown> => !!x);
  const location = locs.length === 0 ? undefined : locs.length === 1 ? locs[0] : locs;
  const ev: Record<string, unknown> = {
    '@type': 'Event', '@id': `${SITE}/o/${l.slug}#event`, name: l.title, url: `${SITE}/o/${l.slug}`, startDate: start, ...(end ? { endDate: end } : {}),
    eventAttendanceMode: mode(l),
    eventStatus: 'https://schema.org/EventScheduled', inLanguage: l.titleLang === 'en' ? 'en' : 'es-AR',
    ...(location ? { location } : {}),
    ...(withAccess(l.summaryEs?.length ? l.summaryEs.join(' ') : null, l) ? { description: withAccess(l.summaryEs?.length ? l.summaryEs.join(' ') : null, l) } : {}),
    // No per-listing image in the DB: use the site OG image (same one the page's og:image uses).
    image: [`${SITE}/opengraph-image`],
  };
  // endDate: only a published end (ends_at, else raw end_date). No end published = no endDate. The old single-day fallback
  // (endDate = startDate) was removed on 2026-10-27 (SEO decision): it gave multi-day events like Stranger Builds a zero duration.
  // Hosting does not establish performing. No verified performer field exists in the data model,
  // so omit that optional property rather than copying the organizer to silence a warning.
  if (l.organizer) {
    const own = about?.website && !PLATFORMS.test(new URL(about.website).hostname.replace(/^www\./, '')) ? about.website : null;
    const url = own ?? orgUrl(l);
    const org = { '@type': 'Organization', name: l.organizer, ...(url ? { url } : {}), ...(about?.description ? { description: about.description } : {}) };
    ev.organizer = org;
  }
  // offers = registration link + availability only, not the prize. No price: entry cost is not verified (no entry_cost column yet).
  // validThrough = published value (timestamp or plain day); open/closed uses the logic instants from lib/dates.ts.
  const close = l.deadlineAt ?? l.deadlineDate ?? end ?? start;
  const closeAt = deadlineLogicIso(l) ?? endLogicIso(l) ?? startLogicIso(l)!;
  const nowD = now ?? new Date();
  const open = isOpenAt(l, nowD);
  const offerUrl = l.applyUrl ?? officialUrl(l) ?? `${SITE}/o/${l.slug}`;
  ev.offers = { '@type': 'Offer', availability: `https://schema.org/${open ? 'InStock' : 'SoldOut'}`, url: offerUrl, ...(new Date(l.createdAt) < new Date(closeAt) ? { validFrom: l.createdAt } : {}), validThrough: close };
  return ev;
}
export const ldScript = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });
