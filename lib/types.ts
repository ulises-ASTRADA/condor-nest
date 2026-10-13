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
  rewardKind: 'total_pool' | 'top_prize' | 'per_winner' | 'range' | 'non_monetary' | null;
  deadlineAt: string | null;
  startsAt: string | null; endsAt: string | null;
  competitors: number | null;
  competitorsKind: 'submissions' | 'registrations' | null;
  eligibility: Eligibility;
  eligibilityNote: string | null;
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
};

export type Row = Record<string, any>;
export function fromRow(r: Row): Listing {
  const n = (v: any) => (v === null || v === undefined ? null : Number(v));
  return {
    id: r.id, slug: r.slug, type: r.type, title: r.title, organizer: r.organizer, source: r.source,
    sourceUrl: r.source_url, rewardAmount: n(r.reward_amount), rewardCurrency: r.reward_currency,
    rewardUsd: n(r.reward_usd), rewardKind: r.reward_kind, deadlineAt: r.deadline_at, startsAt: r.starts_at,
    endsAt: r.ends_at, competitors: n(r.competitors), competitorsKind: r.competitors_kind, eligibility: r.eligibility,
    eligibilityNote: r.eligibility_note, modality: r.modality, city: r.city, ecosystems: r.ecosystems ?? [],
    summaryEs: r.summary_es, featured: !!r.featured && (!r.featured_until || new Date(r.featured_until) > new Date()),
    featuredUntil: r.featured_until, disclosureKey: r.disclosure_key, updatedAt: r.updated_at, createdAt: r.created_at,
    titleLang: r.title_lang ?? 'en', applyUrl: r.apply_url, sourcePostUrl: r.source_post_url,
    verifiedUrl: r.verified_url, curated: !!r.curated,
  };
}

export const SOURCE_LABEL: Record<Listing['source'], string> = {
  superteam: 'Superteam Earn', devpost: 'Devpost', taikai: 'Taikai', luma: 'Luma', x: 'curación propia', manual: 'curación propia',
};
