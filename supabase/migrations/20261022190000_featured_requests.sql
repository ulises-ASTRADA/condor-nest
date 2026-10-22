begin;
create table public.cn_featured_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  fingerprint text not null unique check (fingerprint ~ '^[0-9a-f]{64}$'),
  event_name text not null,
  contact_email text not null,
  details jsonb not null,
  plan_id text not null check (plan_id in ('week','fortnight','month')),
  days smallint not null check (days in (7,14,30)),
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  subtotal_cents integer not null check (subtotal_cents > 0),
  discount_percent smallint not null check (discount_percent in (0,30)),
  discount_cents integer not null check (discount_cents >= 0),
  total_cents integer not null check (total_cents = subtotal_cents - discount_cents and total_cents >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  coupon_id uuid references public.cn_feedback_responses(id),
  status text not null default 'pending_payment' check (status in ('pending_payment','paid','cancelled','expired')),
  expires_at timestamptz not null default (now() + interval '48 hours'),
  owner_mail_status text not null default 'pending',
  contact_mail_status text not null default 'pending',
  payment_reference text,
  paid_at timestamptz,
  check (discount_cents = (subtotal_cents * discount_percent + 50) / 100),
  check ((coupon_id is null and discount_percent = 0) or (coupon_id is not null and discount_percent = 30))
);
create unique index cn_featured_coupon_once on public.cn_featured_requests(coupon_id)
  where coupon_id is not null and status in ('pending_payment','paid');
create index cn_featured_email_created on public.cn_featured_requests(contact_email,created_at);
alter table public.cn_featured_requests enable row level security;
revoke all on public.cn_featured_requests from public, anon, authenticated;
grant all on public.cn_featured_requests to service_role;

create function public.cn_featured_coupon(p_code text,p_email text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare coupon uuid;
begin
  select r.id into coupon from cn_feedback_responses r join cn_feedback_invitations i on i.id = r.invitation_id
    where r.discount_code = upper(trim(p_code)) and i.email = lower(trim(p_email)) and i.revoked_at is null and r.redeemed_at is null;
  if coupon is null or exists(select 1 from cn_featured_requests where coupon_id = coupon and
      (status = 'paid' or (status = 'pending_payment' and expires_at > now()))) then return jsonb_build_object('status','invalid'); end if;
  return jsonb_build_object('status','valid','discount_percent',30);
end $$;

create function public.cn_featured_save(p jsonb,p_fingerprint text,p_subtotal integer,p_days smallint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare saved cn_featured_requests; coupon uuid; percent smallint := 0; discounted integer;
begin
  -- Serialize caps, idempotency and coupon reservations. Public callers cannot execute this RPC.
  perform pg_advisory_xact_lock(hashtext('cn_featured_save'));
  select * into saved from cn_featured_requests where fingerprint = p_fingerprint;
  if found then
    if saved.status in ('cancelled','expired') or (saved.status = 'pending_payment' and saved.expires_at <= now()) then
      return jsonb_build_object('status','expired');
    end if;
    return jsonb_build_object('status','saved','request',to_jsonb(saved));
  end if;
  if (select count(*) from cn_featured_requests where contact_email = p->>'contactEmail' and created_at > now() - interval '1 hour') >= 3
    or (select count(*) from cn_featured_requests where created_at > now() - interval '1 hour') >= 30 then return jsonb_build_object('status','rate'); end if;
  if p_subtotal is null or p_subtotal <= 0 or p_subtotal > 1000000 or p_days not in (7,14,30) then raise exception 'Invalid server price'; end if;
  if nullif(p->>'coupon','') is not null then
    select r.id into coupon from cn_feedback_responses r join cn_feedback_invitations i on i.id = r.invitation_id
      where r.discount_code = p->>'coupon' and i.email = p->>'contactEmail' and i.revoked_at is null and r.redeemed_at is null for update of r;
    if coupon is null then return jsonb_build_object('status','coupon_invalid'); end if;
    update cn_featured_requests set status = 'expired' where coupon_id = coupon and status = 'pending_payment' and expires_at <= now();
    if exists(select 1 from cn_featured_requests where coupon_id = coupon and status in ('pending_payment','paid')) then
      return jsonb_build_object('status','coupon_invalid'); end if;
    percent := 30;
  end if;
  discounted := (p_subtotal * percent + 50) / 100;
  insert into cn_featured_requests(fingerprint,event_name,contact_email,details,plan_id,days,starts_on,ends_on,subtotal_cents,discount_percent,discount_cents,total_cents,coupon_id)
    values (p_fingerprint,p->>'title',p->>'contactEmail',p,p->>'planId',p_days,(p->>'start')::date,(p->>'start')::date + p_days - 1,p_subtotal,percent,discounted,p_subtotal-discounted,coupon)
    returning * into saved;
  return jsonb_build_object('status','saved','request',to_jsonb(saved));
end $$;

create function public.cn_featured_mail_status(p_id uuid,p_target text,p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_target = 'owner' then update cn_featured_requests set owner_mail_status = left(p_status,100) where id = p_id;
  elsif p_target = 'contact' then update cn_featured_requests set contact_mail_status = left(p_status,100) where id = p_id;
  else raise exception 'Invalid target'; end if;
end $$;

-- Admin-only: call only after verifying the payment externally. This does not charge money or activate an event.
create function public.cn_featured_mark_paid(p_id uuid,p_reference text) returns void
language plpgsql security definer set search_path = public as $$
declare request cn_featured_requests;
begin
  perform pg_advisory_xact_lock(hashtext('cn_featured_save'));
  select * into request from cn_featured_requests where id = p_id for update;
  if not found then raise exception 'Request not found'; end if;
  if request.status = 'paid' then return; end if;
  if request.status <> 'pending_payment' or request.expires_at <= now() then raise exception 'Request unavailable'; end if;
  if p_reference is null or length(trim(p_reference)) < 3 then raise exception 'Payment reference required'; end if;
  if request.coupon_id is not null then
    update cn_feedback_responses set redeemed_at = now() where id = request.coupon_id and redeemed_at is null;
    if not found then raise exception 'Coupon already redeemed'; end if;
  end if;
  update cn_featured_requests set status = 'paid',paid_at = now(),payment_reference = left(trim(p_reference),200) where id = p_id;
end $$;
revoke execute on function public.cn_featured_coupon(text,text),public.cn_featured_save(jsonb,text,integer,smallint),public.cn_featured_mail_status(uuid,text,text),public.cn_featured_mark_paid(uuid,text) from public,anon,authenticated;
grant execute on function public.cn_featured_coupon(text,text),public.cn_featured_save(jsonb,text,integer,smallint),public.cn_featured_mail_status(uuid,text,text),public.cn_featured_mark_paid(uuid,text) to service_role;
commit;
