import { NextResponse } from 'next/server';
import { isToken, sha256 } from '@/lib/email';
import { feedbackAnswers, type FeedbackStatus } from '@/lib/feedback';
import { rateLimit } from '@/lib/rate-limit';
import { serverRpc } from '@/lib/server-supabase';

const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });

export async function POST(req: Request) {
  if (req.headers.get('origin') !== new URL(req.url).origin) return reply({ status: 'forbidden' }, 403);
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (!rateLimit(`feedback:${ip}`, 10)) return reply({ status: 'rate' }, 429);
  const raw = await req.text().catch(() => '');
  if (raw.length > 8192) return reply({ status: 'invalid' }, 413);
  let input: Record<string, unknown>;
  try { input = JSON.parse(raw); } catch { return reply({ status: 'invalid' }, 400); }
  if (!input || typeof input !== 'object' || typeof input.token !== 'string' || !isToken(input.token)) return reply({ status: 'invalid' }, 400);
  const answers = feedbackAnswers(input);
  if (!answers) return reply({ status: 'invalid' }, 400);
  try {
    const result = await serverRpc('cn_feedback_submit', { p_token_hash: sha256(input.token), p_answers: answers }) as FeedbackStatus;
    return reply(result, result.status === 'invalid' ? 410 : 200);
  } catch {
    console.error('feedback: save failed');
    return reply({ status: 'error' }, 500);
  }
}
