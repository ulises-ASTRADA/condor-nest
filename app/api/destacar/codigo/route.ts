import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { serverRpc } from '@/lib/server-supabase';

export async function POST(req: Request) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  if (req.headers.get('origin') !== new URL(req.url).origin) return reply({ status: 'forbidden' },403);
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  if (!rateLimit(`featured-code:${ip}`,10)) return reply({ status: 'rate' },429);
  const raw = await req.text();
  if (raw.length > 1024) return reply({ status: 'invalid' },413);
  let b: { code?: unknown; email?: unknown };
  try { b = JSON.parse(raw); } catch { return reply({ status: 'invalid' },400); }
  if (!b || typeof b.code !== 'string' || typeof b.email !== 'string') return reply({ status: 'invalid' },400);
  const code = b.code.trim().toUpperCase(); const email = b.email.trim().toLowerCase();
  if (!/^NIDO30-[A-F0-9]{12}$/.test(code) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return reply({ status: 'invalid' },400);
  try { return reply(await serverRpc('cn_featured_coupon',{ p_code: code,p_email: email })); }
  catch { console.error('featured: coupon check failed'); return reply({ status: 'error' },503); }
}
