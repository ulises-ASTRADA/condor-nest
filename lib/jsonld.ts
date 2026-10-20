import type { Listing } from './types';
import { SITE } from './site';
import { COUNTRY_ES } from './geo';
import type { OrgAbout } from './organizer';
import { access } from './rank';

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
};
export const WEBSITE = { '@type': 'WebSite', '@id': `${SITE}/#website`, name: 'Condor Nest', url: SITE, inLanguage: 'es-AR', publisher: { '@id': `${SITE}/#org` } };

/** Place from DB fields only. addressLocality is the city (venue_locality holds a street or neighborhood, not a locality); nulls omitted. */
export function placeLd(l: Listing): Record<string, unknown> | null {
  if (!l.city && !l.venue) return null;
  const country = l.country && COUNTRY_ES[l.country] ? l.country : null;
  const address = l.city || country ? { '@type': 'PostalAddress', ...(l.city ? { addressLocality: l.city } : {}), ...(country ? { addressCountry: country } : {}) } : null;
  return { '@type': 'Place', name: l.venue ?? l.city, ...(address ? { address } : {}) };
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
/** Short description from DB text only: the first summary bullet, else the first sentence of the eligibility note; null when neither exists. */
const shortDesc = (l: Listing): string | null => {
  const t = l.summaryEs?.find((x) => x && x.trim())?.trim() ?? l.eligibilityNote?.match(/^(.+?[.!?])(\s|$)/)?.[1] ?? l.eligibilityNote ?? null;
  return t ? t : null;
};
/** Compact Event for hub ItemLists: real start/end dates and location only (no fallbacks); null without a start date. */
export function hubEventLd(l: Listing): Record<string, unknown> | null {
  if (!l.startsAt) return null;
  const place = l.modality !== 'online' ? placeLd(l) : null;
  const virt = l.modality !== 'irl' ? { '@type': 'VirtualLocation', url: l.applyUrl ?? l.verifiedUrl ?? l.sourceUrl } : null;
  const location = place && virt ? [place, virt] : place ?? virt;
  return { '@type': 'Event', '@id': `${SITE}/o/${l.slug}#event`, name: l.title, url: `${SITE}/o/${l.slug}`, startDate: l.startsAt, ...(l.endsAt ? { endDate: l.endsAt } : {}), eventAttendanceMode: mode(l), eventStatus: 'https://schema.org/EventScheduled', ...(location ? { location } : {}), ...(withAccess(shortDesc(l), l) ? { description: withAccess(shortDesc(l), l) } : {}) };
}

/** Event schema from real listing data only; null when there is no start date to anchor an Event. */
export function eventLd(l: Listing, about?: OrgAbout | null): Record<string, unknown> | null {
  const start = l.startsAt;
  if (!start) return null;
  const online = l.modality === 'online';
  const place = placeLd(l);
  const virt = { '@type': 'VirtualLocation', url: l.applyUrl ?? l.verifiedUrl ?? l.sourceUrl };
  const location = online ? virt : l.modality === 'hybrid' && place ? [place, virt] : place ?? undefined;
  const ev: Record<string, unknown> = {
    '@type': 'Event', '@id': `${SITE}/o/${l.slug}#event`, name: l.title, url: `${SITE}/o/${l.slug}`, startDate: start, ...(l.endsAt ? { endDate: l.endsAt } : {}),
    eventAttendanceMode: mode(l),
    eventStatus: 'https://schema.org/EventScheduled', inLanguage: l.titleLang === 'en' ? 'en' : 'es-AR',
    ...(location ? { location } : {}),
    ...(withAccess(l.summaryEs?.length ? l.summaryEs.join(' ') : null, l) ? { description: withAccess(l.summaryEs?.length ? l.summaryEs.join(' ') : null, l) } : {}),
    // No per-listing image in the DB: use the site OG image (same one the page's og:image uses).
    image: [`${SITE}/opengraph-image`],
  };
  // endDate: real end date; else single-day fallback = startDate (documented in knowledge notes).
  if (!l.endsAt) ev.endDate = start;
  // organizer + performer: the organizer; url only when it's the organizer's own (see orgUrl). Omitted if DB has no organizer.
  if (l.organizer) {
    const own = about?.website && !PLATFORMS.test(new URL(about.website).hostname.replace(/^www\./, '')) ? about.website : null;
    const url = own ?? orgUrl(l);
    const org = { '@type': 'Organization', name: l.organizer, ...(url ? { url } : {}), ...(about?.description ? { description: about.description } : {}) };
    ev.organizer = org; ev.performer = org;
  }
  // offers = registration (free), not the prize. Availability from open/closed status.
  const close = l.deadlineAt ?? l.endsAt ?? start;
  const open = new Date(close).getTime() > Date.now();
  const offerUrl = l.applyUrl ?? officialUrl(l) ?? `${SITE}/o/${l.slug}`;
  ev.offers = { '@type': 'Offer', price: 0, priceCurrency: 'USD', availability: `https://schema.org/${open ? 'InStock' : 'SoldOut'}`, url: offerUrl, ...(new Date(l.createdAt) < new Date(close) ? { validFrom: l.createdAt } : {}), validThrough: close };
  return ev;
}
export const ldScript = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });
