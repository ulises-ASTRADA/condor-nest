import type { Listing } from './types';
import { SITE } from './site';
import { COUNTRY_ES } from './geo';

const STABLE = new Set(['USD', 'USDC', 'USDT', 'USDG', 'PYUSD']);
export const ORG = {
  '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Condor Nest', url: SITE, logo: `${SITE}/icon.svg`,
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
    eventStatus: 'https://schema.org/EventScheduled', inLanguage: l.titleLang === 'en' ? 'en' : 'es',
    ...(location ? { location } : {}),
    ...(l.organizer ? { organizer: { '@type': 'Organization', name: l.organizer } } : {}),
    ...(l.summaryEs?.length ? { description: l.summaryEs.join(' ') } : {}),
  };
  if (l.rewardAmount != null && l.rewardAmount > 0 && l.rewardCurrency) {
    const cur = l.rewardCurrency.toUpperCase();
    const iso = STABLE.has(cur) ? 'USD' : /^[A-Z]{3}$/.test(cur) ? cur : null;
    if (iso) ev.offers = { '@type': 'Offer', name: 'Premio', price: STABLE.has(cur) && l.rewardUsd != null ? l.rewardUsd : l.rewardAmount, priceCurrency: iso, ...(l.applyUrl ? { url: l.applyUrl } : {}) };
  }
  return ev;
}
export const ldScript = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });
