import type { Listing } from './types';

// Owner-selected placements, in display order. Keep slugs exact: do not promote
// every listing from an organizer. Normal feed filters and closing dates apply.
export const FEATURED_ORDER = ['belo-hackathon-agentic-banking-mcp', 'hackatwin-2026'] as const;
const priority = (l: Listing) => {
  const index = FEATURED_ORDER.findIndex((slug) => slug === l.slug);
  return index < 0 ? FEATURED_ORDER.length : index;
};
export const isFeatured = (l: Listing) => l.featured || FEATURED_ORDER.some((slug) => slug === l.slug);
export const featuredListings = (listings: Listing[]) => listings.filter(isFeatured).sort((a, b) => priority(a) - priority(b));
