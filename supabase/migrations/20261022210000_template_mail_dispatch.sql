begin;
create table public.cn_template_mail_dispatch (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  template_id uuid not null,
  token_hash text unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text
);
alter table public.cn_template_mail_dispatch enable row level security;
revoke all on public.cn_template_mail_dispatch from public, anon, authenticated;
grant all on public.cn_template_mail_dispatch to service_role;

create function public.cn_claim_template_mail(dispatch_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare job cn_template_mail_dispatch;
begin
  if dispatch_hash is null or dispatch_hash !~ '^[0-9a-f]{64}$' then return null; end if;
  update cn_template_mail_dispatch
    set status = 'sending', token_hash = null
    where token_hash = dispatch_hash and expires_at > now() and status = 'pending'
    returning * into job;
  if job.id is null then return null; end if;
  return jsonb_build_object('id',job.id,'email',job.email,'template_id',job.template_id);
end;
$$;
create function public.cn_template_mail_delivery(dispatch_id uuid, delivery_error text default null) returns void
language sql security definer set search_path = public as $$
  update cn_template_mail_dispatch
    set status = case when delivery_error is null then 'sent' else 'failed' end,
        sent_at = case when delivery_error is null then now() else null end,
        last_error = left(delivery_error,100)
    where id = dispatch_id and status = 'sending';
$$;
revoke all on function public.cn_claim_template_mail(text), public.cn_template_mail_delivery(uuid,text) from public, anon, authenticated;
grant execute on function public.cn_claim_template_mail(text), public.cn_template_mail_delivery(uuid,text) to service_role;
commit;
