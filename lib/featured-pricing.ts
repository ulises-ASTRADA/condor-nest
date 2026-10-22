// Proposed launch prices. Keep in cents; this catalog is not a live offer yet.
export const FEATURED_PLANS = [
  { id: 'week', days: 7, priceCents: 1900, description: 'Un impulso para la última semana de inscripción.' },
  { id: 'fortnight', days: 14, priceCents: 2900, description: 'Dos semanas para darle más visibilidad a tu convocatoria.' },
  { id: 'month', days: 30, priceCents: 4900, description: 'Acompañá tu convocatoria durante un mes.' },
] as const;
export type FeaturedPlanId = typeof FEATURED_PLANS[number]['id'];
export type FeaturedEvent = {
  title: string; organizer: string; email: string; phone?: string; prize?: string; startsOn?: string; endsOn?: string;
  summary?: string; eligibility?: string; organizerAbout?: string; registrationUrl?: string;
  modality?: 'presencial' | 'virtual' | 'hibrido'; location?: string;
};

export function featuredQuote(planId: string, discountPercent = 0) {
  const plan = FEATURED_PLANS.find((item) => item.id === planId);
  if (!plan || !Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 100) throw new Error('Invalid quote');
  const discountCents = Math.round(plan.priceCents * discountPercent / 100);
  return { days: plan.days, subtotalCents: plan.priceCents, discountPercent, discountCents, totalCents: plan.priceCents - discountCents, currency: 'USD' as const };
}

export function featuredMoney(cents: number) {
  return `USD ${new Intl.NumberFormat('es-AR', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(cents / 100)}`;
}

// UTC calendar arithmetic avoids an extra/missing day around daylight saving changes.
// End date is inclusive: seven days beginning Oct 22 end Oct 28.
export function featuredEndDate(start: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return '';
  const date = new Date(`${start}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== start) return '';
  date.setUTCDate(date.getUTCDate() + days - 1);
  return date.toISOString().slice(0, 10);
}
