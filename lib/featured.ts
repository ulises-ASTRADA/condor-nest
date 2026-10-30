import type { Listing } from './types';

// Owner-selected placements, in display order. Keep slugs exact: do not promote
// every listing from an organizer. Normal feed filters and closing dates apply.
// Editorial pins are intentionally short-lived. Keep this list empty when a
// campaign ends so a closed listing cannot remain promoted from source code.
export const FEATURED_ORDER = [] as const;
const priority = (l: Listing) => {
  const index = FEATURED_ORDER.findIndex((slug) => slug === l.slug);
  return index < 0 ? FEATURED_ORDER.length : index;
};
export const isFeatured = (l: Listing) => l.featured || FEATURED_ORDER.some((slug) => slug === l.slug);
export const featuredListings = (listings: Listing[]) => listings.filter(isFeatured).sort((a, b) => priority(a) - priority(b));
