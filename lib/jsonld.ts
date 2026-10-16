import type { Listing } from './types';
import { SITE } from './site';
import { COUNTRY_ES } from './geo';

const PLATFORMS = /(^|\.)(luma\.com|lu\.ma|devpost\.com|taikai\.network|eventtia\.com|eventbrite\.[a-z.]+|x\.com|twitter\.com|superteam\.fun|earn\.superteam\.fun|forms\.gle|google\.com|notion\.site|dorahacks\.io)$/i;
/** Organizer's own site (origin of the verified official page), skipping event platforms. */
const orgUrl = (l: Listing) => { try { const u = l.verifiedUrl ? new URL(l.verifiedUrl) : null; return u && !PLATFORMS.test(u.hostname) ? u.origin : null; } catch { return null; } };
/** Fallback for organizer.url: origin of the official link (verified > apply > source). */
const officialUrl = (l: Listing) => l.verifiedUrl ?? l.applyUrl ?? l.sourceUrl ?? null;
const originOf = (u: string | null) => { try { return u ? new URL(u).origin : null; } catch { return null; } };
export const ORG = {
  '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Condor Nest', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/icon.svg` }, image: `${SITE}/opengraph-image`,
  areaServed: 'Latinoamérica', foundingLocation: { '@type': 'Place', name: 'Córdoba, Argentina' },
};
export const WEBSITE = { '@type': 'WebSite', '@id': `${SITE}/#website`, name: 'Condor Nest', url: SITE, inLanguage: 'es-AR', publisher: { '@id': `${SITE}/#org` } };

/** Event schema from real listing data only; null when there is no start date to anchor an Event. */
export function eventLd(l: Listing): Record<string, unknown> | null {
  const start = l.startsAt;
  if (!start) return null;
  const online = l.modality === 'online';
  const place = l.city ? { '@type': 'Place', name: l.city, address: { '@type': 'PostalAddress', addressLocality: l.city, ...(l.country && COUNTRY_ES[l.country] ? { addressCountry: l.country } : {}) } } : null;
  const virt = { '@type': 'VirtualLocation', url: l.applyUrl ?? l.verifiedUrl ?? l.sourceUrl };
  const location = online ? virt : l.modality === 'hybrid' && place ? [place, virt] : place ?? undefined;
  const ev: Record<string, unknown> = {
    '@type': 'Event', name: l.title, url: `${SITE}/o/${l.slug}`, startDate: start, ...(l.endsAt ? { endDate: l.endsAt } : {}),
    eventAttendanceMode: `https://schema.org/${online ? 'Online' : l.modality === 'hybrid' ? 'Mixed' : 'Offline'}EventAttendanceMode`,
    eventStatus: 'https://schema.org/EventScheduled', inLanguage: l.titleLang === 'en' ? 'en' : 'es-AR',
    ...(location ? { location } : {}),
    ...(l.summaryEs?.length ? { description: l.summaryEs.join(' ') } : {}),
    // No per-listing image in the DB: use the site OG image (same one the page's og:image uses).
    image: [`${SITE}/opengraph-image`],
  };
  // endDate: real end date; else single-day fallback = startDate (documented in knowledge notes).
  if (!l.endsAt) ev.endDate = start;
  // organizer + performer: the organizer, url = own site, else official-link origin. Omitted if DB has no organizer.
  if (l.organizer) {
    const url = orgUrl(l) ?? originOf(officialUrl(l));
    const org = { '@type': 'Organization', name: l.organizer, ...(url ? { url } : {}) };
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
