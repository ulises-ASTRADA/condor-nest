begin;

-- A durable delivery record, created in the same transaction as confirmation.
-- Existing subscribers are not backfilled or emailed by this migration.
create table public.cn_newsletter_welcome (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  last_error text
);
alter table public.cn_newsletter_welcome enable row level security;
revoke all on public.cn_newsletter_welcome from public, anon, authenticated;

create function public.cn_confirm_with_welcome(confirm_hash text, unsub_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare recipient text; welcome_id uuid;
begin
  if confirm_hash !~ '^[0-9a-f]{64}$' or unsub_hash !~ '^[0-9a-f]{64}$' or confirm_hash is null or unsub_hash is null then
    return jsonb_build_object('status', 'invalid');
  end if;
  -- The row lock acquired by UPDATE makes concurrent confirmation attempts single-use.
  update newsletter_subscribers s
    set status = 'confirmed', confirmed_at = now(), confirm_token_hash = null,
        confirm_expires_at = null, unsub_token_hash = unsub_hash
    where s.confirm_token_hash = confirm_hash and s.confirm_expires_at > now() and s.status = 'pending'
    returning s.email into recipient;
  if recipient is null then return jsonb_build_object('status', 'invalid'); end if;
  insert into cn_newsletter_welcome(email) values(recipient) returning id into welcome_id;
  return jsonb_build_object('status', 'confirmed', 'welcome', jsonb_build_object('id', welcome_id, 'email', recipient));
end;
$$;

create function public.cn_welcome_delivery(welcome_id uuid, delivery_error text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  update cn_newsletter_welcome
    set status = case when delivery_error is null then 'sent' else 'failed' end,
        sent_at = case when delivery_error is null then now() else null end,
        last_error = left(delivery_error, 100)
    where id = welcome_id and status <> 'sent';
end;
$$;
revoke all on function public.cn_confirm_with_welcome(text,text), public.cn_welcome_delivery(uuid,text) from public, anon, authenticated;
grant execute on function public.cn_confirm_with_welcome(text,text), public.cn_welcome_delivery(uuid,text) to service_role;

commit;
