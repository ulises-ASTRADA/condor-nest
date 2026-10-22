import { NextResponse } from 'next/server';
import { isToken, sha256 } from '@/lib/email';
import { discountReceipt } from '@/lib/discount-receipt';
import type { FeedbackStatus } from '@/lib/feedback';
import { rateLimit } from '@/lib/rate-limit';
import { serverRpc } from '@/lib/server-supabase';

const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
const reply = (status: number) => NextResponse.json({ status: 'unavailable' }, { status, headers });

export async function POST(req: Request) {
  if (req.headers.get('origin') !== new URL(req.url).origin) return reply(403);
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (!rateLimit(`feedback-receipt:${ip}`, 20)) return reply(429);
  const raw = await req.text().catch(() => '');
  if (raw.length > 1024) return reply(413);
  let input: unknown;
  try { input = JSON.parse(raw); } catch { return reply(400); }
  if (!input || typeof input !== 'object' || !('token' in input) || typeof input.token !== 'string' || !isToken(input.token)) return reply(400);
  try {
    const result = await serverRpc('cn_feedback_status', { p_token_hash: sha256(input.token) }) as FeedbackStatus;
    if (result.status !== 'completed' || !result.discount_code) return reply(410);
    const bytes = await discountReceipt(result.discount_code);
    return new Response(Buffer.from(bytes), { headers: { ...headers, 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="condor-nest-descuento.pdf"' } });
  } catch {
    console.error('feedback: receipt failed');
    return reply(500);
  }
}
