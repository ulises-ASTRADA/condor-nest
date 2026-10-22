import { FEATURED_PLANS, featuredEndDate, type FeaturedPlanId } from './featured-pricing';
import { mapLocation } from './map-location';

export function featuredRequest(value: unknown, today: string) {
  if (!value || typeof value !== 'object') return null;
  const b = value as Record<string, unknown>;
  const read = (key: string) => typeof b[key] === 'string' ? b[key].trim() : '';
  const f = {
    title: read('title'), summary: read('summary'), prize: read('prize'), eventStart: read('eventStart'), eventEnd: read('eventEnd'),
    modality: read('modality'), location: read('modality') === 'virtual' ? '' : read('location'), eligibility: read('eligibility'),
    registrationUrl: read('registrationUrl'), organizerName: read('organizerName'), organizerAbout: read('organizerAbout'),
    contactEmail: read('contactEmail').toLowerCase(), contactPhone: read('contactPhone'), notes: read('notes'),
    planId: read('planId') as FeaturedPlanId, start: read('start'), coupon: read('coupon').toUpperCase(),
  };
  for (const [key, min, max] of [
    ['title', 3, 200], ['summary', 1, 300], ['prize', 1, 160], ['eligibility', 1, 1000],
    ['organizerName', 1, 200], ['organizerAbout', 1, 1000], ['contactPhone', 0, 40], ['notes', 0, 1000],
  ] as const) if (f[key].length < min || f[key].length > max) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.contactEmail) || f.contactEmail.length > 254) return null;
  if (!['presencial', 'virtual', 'hibrido'].includes(f.modality) || (f.modality !== 'virtual' && !mapLocation(f.location))) return null;
  if (![f.eventStart, f.eventEnd, f.start].every((date) => !!featuredEndDate(date, 1)) || f.eventEnd < f.eventStart || f.start < today) return null;
  if (!FEATURED_PLANS.some((plan) => plan.id === f.planId) || (f.coupon && !/^NIDO30-[A-F0-9]{12}$/.test(f.coupon))) return null;
  try {
    const url = new URL(f.registrationUrl);
    if (url.protocol !== 'https:' || !url.hostname.includes('.') || url.username || url.password || f.registrationUrl.length > 500) return null;
    f.registrationUrl = url.href;
  } catch { return null; }
  return f;
}

export type FeaturedRequest = NonNullable<ReturnType<typeof featuredRequest>>;
export const featuredToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
