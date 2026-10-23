import { NextResponse } from 'next/server';
import { featuredRequest, featuredToday } from '@/lib/featured-request';
import { featuredQuote } from '@/lib/featured-pricing';
import { featuredEmail, type SavedFeaturedRequest } from '@/lib/featured-email';
import { resendSend, sha256, isToken } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { serverRpc } from '@/lib/server-supabase';
import { turnstileOk } from '@/lib/turnstile';

export const maxDuration = 60;
export async function POST(req: Request) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body,{ status,headers:{ 'Cache-Control':'no-store' } });
  if (req.headers.get('origin') !== new URL(req.url).origin) return reply({ status:'forbidden' },403);
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  if (!rateLimit(`featured:${ip}`,6)) return reply({ status:'rate' },429);
  const raw = await req.text();
  if (raw.length > 16384) return reply({ status:'invalid' },413);
  let b: Record<string, unknown>;
  try { b = JSON.parse(raw); } catch { return reply({ status:'invalid' },400); }
  if (!b || typeof b !== 'object' || Array.isArray(b)) return reply({ status:'invalid' },400);
  const hasInvitation = b.invitationToken !== undefined;
  if (hasInvitation && !isToken(b.invitationToken)) return reply({ status:'invitation_invalid' },400);
  const f = featuredRequest(b,featuredToday());
  if (!f) return reply({ status:'invalid' },400);
  if (!(await turnstileOk(b.turnstileToken,ip))) return reply({ status:'bot' },403);
  const base = featuredQuote(f.planId);
  let result: { status:string; request?:SavedFeaturedRequest };
  try {
    const invitationHash = hasInvitation ? sha256(b.invitationToken as string) : undefined;
    const args = { p:f,p_fingerprint:sha256(JSON.stringify(invitationHash ? { details:f,invitationHash } : f)),p_subtotal:base.subtotalCents,p_days:base.days };
    result = invitationHash
      ? await serverRpc('cn_featured_save_from_invite',{ ...args,p_token_hash:invitationHash })
      : await serverRpc('cn_featured_save',args);
  }
  catch { console.error('featured: save failed'); return reply({ status:'error' },503); }
  if (result.status !== 'saved' || !result.request) return reply({ status:result.status },result.status === 'rate' ? 429 : 409);
  const saved = result.request;
  const notify = process.env.PUBLICAR_NOTIFY_TO;
  const deliveries = await Promise.all((['owner','contact'] as const).map(async (target) => {
    if ((target === 'owner' ? saved.owner_mail_status : saved.contact_mail_status) === 'sent') return true;
    const to = target === 'owner' ? notify : saved.details.contactEmail;
    const sent = to ? await resendSend({ to:[to],...(target === 'owner' ? { reply_to:saved.details.contactEmail } : notify ? { reply_to:notify } : {}),...featuredEmail(saved,target) },`featured-${saved.id}-${target}`) : { ok:false as const,reason:'notify_not_set' };
    await serverRpc('cn_featured_mail_status',{ p_id:saved.id,p_target:target,p_status:sent.ok ? 'sent' : `failed:${sent.reason}` }).catch(() => { console.error('featured: mail status update failed'); });
    return sent.ok;
  }));
  return reply({ status:'saved',id:saved.id,subtotalCents:saved.subtotal_cents,discountPercent:saved.discount_percent,discountCents:saved.discount_cents,totalCents:saved.total_cents,expiresAt:saved.expires_at,contactMailSent:deliveries[1] });
}
