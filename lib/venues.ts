/** Per-day venues for events held in more than one place, read from raw->'venues' (no dedicated column).
 *  Shape in the DB: [{ label, name, street, locality }]. Anything malformed is dropped; fewer than two valid
 *  venues means "single venue" and callers keep the regular venue/venue_locality rendering. */
export type Venue = { label: string; name: string; street: string; locality: string };

const str = (v: unknown) => (typeof v === 'string' && v.trim() && v.length <= 200 ? v.trim() : null);

export function parseVenues(v: unknown): Venue[] | null {
  if (!Array.isArray(v)) return null;
  const out: Venue[] = [];
  for (const x of v.slice(0, 6)) {
    const label = str(x?.label), name = str(x?.name), street = str(x?.street), locality = str(x?.locality);
    if (label && name && street && locality) out.push({ label, name, street, locality });
  }
  return out.length >= 2 ? out : null;
}

/** Line shown under the day label: the name only when the street does not already start with it
 *  ("Lucerna 34, Juárez, Ciudad de México" vs "Sandbox Hub, Luis G. Urbina 4, Polanco, Ciudad de México"). */
export const venueText = (v: Venue) => [v.street.toLowerCase().startsWith(v.name.toLowerCase()) ? null : v.name, v.street, v.locality].filter(Boolean).join(', ');

/** Maps query: address only (street, locality, country), never the place name or any note in parentheses. */
export const venueQuery = (v: Venue, countryName?: string | null) => [v.street, v.locality, countryName].filter(Boolean).join(', ').replace(/\s*\([^)]*\)/g, '');
