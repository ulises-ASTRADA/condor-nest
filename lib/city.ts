/** Shared city helpers (hubs + feed filter). Accent/case-insensitive key and a URL slug derived from DB city names. */
export const normCity = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
export const citySlug = (s: string) => normCity(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
