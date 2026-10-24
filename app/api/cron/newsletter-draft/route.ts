import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getListings } from '@/lib/supabase';
import { digestContent, nextMondayIssueDate, selectDigestListings } from '@/lib/newsletter-digest';

export const dynamic = 'force-dynamic';
const TEST_SEGMENT_ID = 'e1d0abe6-6148-4b90-9a02-2be2a7764fe8';
const hash = (value: string) => createHash('sha256').update(value).digest();

type Broadcast = { id: string; name: string; segment_id?: string; audience_id?: string };
async function resend(path: string, key: string, init?: RequestInit) {
  const response = await fetch(`https://api.resend.com${path}`, {
    ...init, cache: 'no-store', signal: AbortSignal.timeout(10000),
    headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new Error(`Resend ${response.status}`);
  return response.json();
}

async function existingDraft(name: string, key: string): Promise<Broadcast | null> {
  let after: string | null = null;
  for (let page = 0; page < 10; page++) {
    const params = new URLSearchParams({ limit: '100' });
    if (after) params.set('after', after);
    const result = await resend(`/broadcasts?${params}`, key) as { data?: Broadcast[]; has_more?: boolean };
    const broadcasts = result.data ?? [];
    const found = broadcasts.find((item) => item.name === name && (item.segment_id ?? item.audience_id) === TEST_SEGMENT_ID);
    if (found) return found;
    if (!result.has_more) return null;
    after = broadcasts.at(-1)?.id ?? null;
    if (!after) throw new Error('Resend pagination failed');
  }
  throw new Error('Resend pagination limit reached');
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !timingSafeEqual(hash(req.headers.get('authorization') ?? ''), hash(`Bearer ${secret}`))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const key = process.env.RESEND_BROADCAST_API_KEY;
  if (!key) return NextResponse.json({ error: 'broadcast_key_not_configured' }, { status: 503 });
  const from = process.env.RESEND_FROM;
  if (!from || /@resend\.dev>?$/i.test(from)) return NextResponse.json({ error: 'verified_sender_required' }, { status: 503 });
  const issueDate = nextMondayIssueDate(new Date());
  const name = `Condor Nest · ${issueDate}`;
  try {
    const previous = await existingDraft(name, key);
    if (previous) return NextResponse.json({ ok: true, alreadyExists: true, broadcastId: previous.id });
    const listings = selectDigestListings(await getListings(), issueDate);
    if (listings.length < 3) return NextResponse.json({ error: 'insufficient_open_listings', count: listings.length }, { status: 503 });
    const content = digestContent(listings, issueDate);
    const created = await resend('/broadcasts', key, { method: 'POST', body: JSON.stringify({
      segment_id: TEST_SEGMENT_ID, from, ...content,
    }) }) as { id?: string };
    if (!created.id) throw new Error('Resend draft ID missing');
    return NextResponse.json({ ok: true, broadcastId: created.id, issueDate, count: listings.length });
  } catch (error) {
    console.error('newsletter draft:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'draft_failed' }, { status: 502 });
  }
}
