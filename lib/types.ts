/** Returns the URL only if it parses and uses https:, else null (blocks javascript:/data: etc.). */
export function safeHttpsUrl(v: unknown): string | null {
  if (typeof v !== 'string' || !v) return null;
  try { const x = new URL(v); return x.protocol === 'https:' ? x.toString() : null; } catch { return null; }
}
export type ListingType = 'hackathon' | 'bounty' | 'grant';
export type Eligibility = 'ar' | 'latam' | 'global' | 'restricted' | 'unknown';
export type Listing = {
  id: string; slug: string;
  type: ListingType;
  title: string; organizer: string | null;
  source: 'superteam' | 'devpost' | 'taikai' | 'luma' | 'x' | 'manual';
  sourceUrl: string;
  rewardAmount: number | null;
  rewardCurrency: string | null;
  rewardUsd: number | null;
  rewardText: string | null;  // prize description from the official page (credits, jobs, 'a anunciar'...)
  rewardKind: 'total_pool' | 'top_prize' | 'per_winner' | 'range' | 'non_monetary' | null;
  deadlineAt: string | null;
  startsAt: string | null; endsAt: string | null;
  competitors: number | null;
  competitorsKind: 'submissions' | 'registrations' | null;
  eligibility: Eligibility;
  eligibilityNote: string | null;
  eligibilityShort: string | null; // card label, <= ~28 chars
  modality: 'online' | 'irl' | 'hybrid'; city: string | null;
  ecosystems: string[];
  summaryEs: string[] | null;
  featured: boolean; featuredUntil: string | null;
  disclosureKey: 'belo' | null;
  updatedAt: string;
  // additions not in spec §3.1 but needed by other spec sections
  createdAt: string;          // "Más nuevos" sort (§3.4)
  titleLang: string;          // lang="en" on English titles (§5.1)
  applyUrl: string | null;    // CTA target; null = link pending
  sourcePostUrl: string | null;
  verifiedUrl: string | null;
  curated: boolean;
  country: string | null;     // ISO of the host/restricted country, 'LATAM', or null
  venue: string | null; venueLocality: string | null; // from the official source only
};

export type Row = Record<string, any>;
/** Public columns (raw is not readable by anon). */
export const LISTING_COLS = 'id,slug,source,type,title,title_lang,organizer,source_url,apply_url,reward_amount,reward_currency,reward_usd,reward_kind,reward_text,deadline_at,starts_at,ends_at,competitors,competitors_kind,eligibility,eligibility_note,eligibility_short,modality,city,ecosystems,summary_es,featured,featured_until,curated,disclosure_key,source_post_url,verified_url,created_at,updated_at,in_latam,country,venue,venue_locality';
export function fromRow(r: Row): Listing {
  const u = (v: any) => safeHttpsUrl(v);
  const n = (v: any) => (v === null || v === undefined ? null : Number(v));
  return {
    id: r.id, slug: r.slug, type: r.type, title: r.title, organizer: r.organizer, source: r.source,
    sourceUrl: u(r.source_url) ?? '', rewardAmount: n(r.reward_amount), rewardCurrency: r.reward_currency,
    rewardUsd: n(r.reward_usd), rewardText: typeof r.reward_text === 'string' && r.reward_text.trim() ? r.reward_text.trim() : null, rewardKind: r.reward_kind, deadlineAt: r.deadline_at, startsAt: r.starts_at,
    endsAt: r.ends_at, competitors: n(r.competitors), competitorsKind: r.competitors_kind, eligibility: r.eligibility,
    eligibilityNote: r.eligibility_note, eligibilityShort: typeof r.eligibility_short === 'string' && r.eligibility_short.trim() ? r.eligibility_short.trim() : null, modality: r.modality, city: r.city, ecosystems: r.ecosystems ?? [],
    summaryEs: r.summary_es, featured: !!r.featured && (!r.featured_until || new Date(r.featured_until) > new Date()),
    featuredUntil: r.featured_until, disclosureKey: r.disclosure_key, updatedAt: r.updated_at, createdAt: r.created_at,
    titleLang: r.title_lang ?? 'en', applyUrl: u(r.apply_url), sourcePostUrl: u(r.source_post_url),
    verifiedUrl: u(r.verified_url), curated: !!r.curated,
    country: typeof r.country === 'string' ? r.country.toUpperCase() : null,
    venue: r.venue ?? null, venueLocality: r.venue_locality ?? null,
  };
}

export const SOURCE_LABEL: Record<Listing['source'], string> = {
  superteam: 'Superteam Earn', devpost: 'Devpost', taikai: 'Taikai', luma: 'Luma', x: 'curación propia', manual: 'curación propia',
};
