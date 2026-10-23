'use client';
import { publicAnalyticsPath, type CardPlacement, type ListingEvent } from './listing-analytics';

export const listingAnalyticsActive = () => process.env.NEXT_PUBLIC_LISTING_ANALYTICS_ENABLED === '1' && !navigator.webdriver && !window.localStorage.getItem('cn-analytics-opt-out');
const contexts = new WeakMap<HTMLAnchorElement, { exposure: string; position: number; placement: CardPlacement; path: string }>();
let queue: ListingEvent[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;
export function flushListingEvents() {
  clearTimeout(timer); timer = undefined;
  if (!queue.length) return;
  const events = queue.splice(0, 20);
  // Best effort only: analytics never block navigation. UUIDs make retries idempotent in Postgres.
  void fetch('/api/analytics/listings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ events }), keepalive: true }).catch(() => {});
  if (queue.length) flushListingEvents();
}
export function emitListingEvent(event: ListingEvent, immediate = false) {
  queue.push(event);
  if (immediate || queue.length >= 20) flushListingEvents();
  else timer ??= setTimeout(flushListingEvents, 250);
}
export function cardContext(card: HTMLAnchorElement) {
  const path = window.location.pathname;
  if (!publicAnalyticsPath(path)) return null;
  const placement = card.dataset.cnPlacement as CardPlacement;
  // Actual visual order after feed CSS filtering/sorting, excluding hidden cards and non-card inserts.
  const cards = [...document.querySelectorAll<HTMLAnchorElement>('[data-cn-card]')]
    .filter((el) => el.dataset.cnPlacement === placement && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
    .sort((a, b) => { const ar = a.getBoundingClientRect(), br = b.getBoundingClientRect(); return ar.top - br.top || ar.left - br.left; });
  const position = cards.indexOf(card) + 1;
  if (!position || position > 500) return null;
  const old = contexts.get(card);
  if (old && old.position === position && old.placement === placement && old.path === path) return old;
  const value = { exposure: crypto.randomUUID(), position, placement, path };
  contexts.set(card, value);
  return value;
}
export function cardEvent(card: HTMLAnchorElement, kind: 'impression' | 'card_click') {
  const context = cardContext(card);
  if (!context) return null;
  const event = { ...context, id: crypto.randomUUID(), kind, slug: card.dataset.cnCard! };
  emitListingEvent(event, kind === 'card_click');
  return context.exposure;
}
