import { NextResponse } from 'next/server';
import { rpc } from '@/lib/supabase';
// Stores the address as 'pending'. Double opt-in mail is NOT sent yet: provider is an open question (spec §6).
export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ status: 'invalid' }, { status: 400 });
  try {
    const status = await rpc('cn_subscribe', { email });
    return NextResponse.json({ status });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
