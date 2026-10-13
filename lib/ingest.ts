// Daily ingestion. Eligibility is only set from source data (spec §3.3); otherwise 'unknown'.
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; CondorNestBot/0.1; +https://github.com/ulises-ASTRADA)' };
const STABLE = new Set(['USD', 'USDC', 'USDT', 'USDG', 'PYUSD', 'UXD']);
export type IngestRow = Record<string, unknown> & { external_id: string; slug: string };
const slugify = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

const LATAM: Record<string, string> = { Argentina: 'ar', Brazil: 'Brasil', Mexico: 'México', Chile: 'Chile', Colombia: 'Colombia', Peru: 'Perú', Uruguay: 'Uruguay', Paraguay: 'Paraguay', Bolivia: 'Bolivia', Ecuador: 'Ecuador', Venezuela: 'Venezuela' };
function superteamEligibility(region: string | undefined): { eligibility: string; note: string | null; tags: string[] } {
  if (!region) return { eligibility: 'unknown', note: null, tags: [] };
  const r = region.trim();
  if (/^global$/i.test(r)) return { eligibility: 'global', note: null, tags: ['Global'] };
  if (/latin america|latam/i.test(r)) return { eligibility: 'latam', note: null, tags: ['LatAm'] };
  if (r === 'Argentina') return { eligibility: 'ar', note: null, tags: ['AR'] };
  return { eligibility: 'restricted', note: `Solo ${LATAM[r] ?? r}`, tags: [r] };
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

export async function fetchSuperteam(): Promise<IngestRow[]> {
  const r = await fetch('https://superteam.fun/api/listings?take=100', { headers: UA, cache: 'no-store' });
  if (!r.ok) throw new Error(`superteam ${r.status}`);
  const list: any[] = await r.json();
  return pool(list, 4, async (x) => {
    let region: string | undefined; let hackathon = false;
    try {
      const d = await (await fetch(`https://superteam.fun/api/listings/details/${x.slug}`, { headers: UA, cache: 'no-store' })).json();
      region = d.region; hackathon = !!d.hackathonId;
    } catch {}
    const el = superteamEligibility(region);
    const token = String(x.token ?? '').toUpperCase();
    const fixed = x.compensationType === 'fixed' && x.rewardAmount > 0;
    return {
      external_id: x.id, slug: `st-${x.slug}`.slice(0, 90),
      type: x.type === 'grant' ? 'grant' : hackathon || x.type === 'hackathon' ? 'hackathon' : 'bounty',
      title: x.title, title_lang: /[áéíóúñ¿¡]|\b(crea|escrib|para|tu)\b/i.test(x.title) ? 'es' : 'en',
      organizer: x.sponsor?.name ?? null,
      source_url: `https://superteam.fun/earn/listing/${x.slug}`, apply_url: `https://superteam.fun/earn/listing/${x.slug}`,
      reward_amount: fixed ? x.rewardAmount : x.maxRewardAsk ?? null, reward_currency: token || null,
      reward_usd: fixed && STABLE.has(token) ? x.rewardAmount : null,
      reward_kind: fixed ? 'total_pool' : x.maxRewardAsk ? 'range' : null,
      deadline_at: x.deadline, competitors: x._count?.Submission ?? null, competitors_kind: 'submissions',
      eligibility: el.eligibility, eligibility_note: el.note, region_tags: el.tags, modality: 'online',
      ecosystems: ['Solana'], raw: x,
    };
  });
}

const MONTHS: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
/** "Aug 31 - Oct 23, 2026" → end date 23:59 US Eastern (Devpost lists don't carry the hour; approximation) */
export function devpostEnd(s: string): string | null {
  const m = s.match(/(?:([A-Z][a-z]{2}) )?(\d{1,2}), (\d{4})\s*$/);
  if (!m) return null;
  const monthStr = m[1] ?? s.match(/([A-Z][a-z]{2}) \d{1,2}\s*-/)?.[1];
  if (!monthStr || MONTHS[monthStr] === undefined) return null;
  return new Date(Date.UTC(+m[3], MONTHS[monthStr], +m[2], 23 + 4, 59)).toISOString();
}
export async function fetchDevpost(): Promise<IngestRow[]> {
  const all: any[] = [];
  for (let page = 1; page <= 15; page++) {
    const r = await fetch(`https://devpost.com/api/hackathons?status[]=open&page=${page}`, { headers: UA, cache: 'no-store' });
    if (!r.ok) throw new Error(`devpost ${r.status}`);
    const j = await r.json();
    all.push(...j.hackathons);
    if (all.length >= j.meta.total_count || j.hackathons.length === 0) break;
  }
  return all.map((h) => {
    const prizeTxt = String(h.prize_amount ?? '');
    const amount = Number(prizeTxt.replace(/<[^>]+>/g, '').replace(/[^0-9.]/g, '')) || null;
    const isUsd = prizeTxt.trim().startsWith('$');
    const online = /online/i.test(h.displayed_location?.location ?? '');
    return {
      external_id: String(h.id), slug: `dp-${slugify(h.title)}-${h.id}`,
      type: 'hackathon', title: h.title, title_lang: 'en', organizer: h.organization_name ?? null,
      source_url: h.url, apply_url: h.url,
      reward_amount: amount, reward_currency: amount ? (isUsd ? 'USD' : null) : null, reward_usd: amount && isUsd ? amount : null,
      reward_kind: amount ? 'total_pool' : null,
      deadline_at: devpostEnd(h.submission_period_dates ?? ''),
      competitors: h.registrations_count ?? null, competitors_kind: 'registrations',
      eligibility: 'unknown', eligibility_note: h.invite_only ? 'Solo por invitación' : null,
      modality: online ? 'online' : 'irl', city: online ? null : h.displayed_location?.location ?? null,
      ecosystems: (h.themes ?? []).map((t: any) => t.name).slice(0, 4), raw: h,
    };
  });
}

/** Taikai: best effort, parses the Apollo cache embedded in taikai.network/hackathons */
export async function fetchTaikai(): Promise<IngestRow[]> {
  const r = await fetch('https://taikai.network/hackathons', { headers: UA, cache: 'no-store' });
  if (!r.ok) throw new Error(`taikai ${r.status}`);
  const html = await r.text();
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('taikai: no __NEXT_DATA__');
  const data = JSON.parse(m[1]);
  let cache: any = null;
  const walk = (o: any) => { if (cache || !o || typeof o !== 'object') return; if (Object.keys(o).some((k) => k.startsWith('Challenge:'))) { cache = o; return; } Object.values(o).forEach(walk); };
  walk(data);
  if (!cache) throw new Error('taikai: no Apollo cache');
  const ref = (x: any) => (x?.__ref ? cache[x.__ref] : null);
  return Object.entries(cache).filter(([k, v]: any) => k.startsWith('Challenge:') && !v.isClosed && v.isPublic !== false).map(([, c]: any) => {
    const org = ref(c.organization); const cur = ref(c.prizeCurrency)?.name ?? null;
    const amount = c.prize > 0 ? c.prize / Math.pow(10, c.prizeDecimals ?? 0) : null;
    return {
      external_id: c.id, slug: `tk-${slugify(c.slug)}`, type: 'hackathon', title: c.name, title_lang: 'en',
      organizer: org?.name ?? null, source_url: `https://taikai.network/${org?.slug}/hackathons/${c.slug}`,
      apply_url: `https://taikai.network/${org?.slug}/hackathons/${c.slug}`,
      reward_amount: amount, reward_currency: amount ? cur : null, reward_usd: amount && cur && STABLE.has(cur) ? amount : null,
      reward_kind: amount ? 'total_pool' : null, deadline_at: null,
      competitors: c.participantsCount ?? null, competitors_kind: 'registrations',
      eligibility: 'unknown', modality: 'online', ecosystems: [], raw: { id: c.id, slug: c.slug, shortDescription: c.shortDescription },
    };
  });
}

export const SOURCES = { superteam: fetchSuperteam, devpost: fetchDevpost, taikai: fetchTaikai } as const;
