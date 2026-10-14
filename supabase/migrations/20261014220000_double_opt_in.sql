-- Double opt-in: hashed confirm token with expiry, random unsubscribe token.
alter table public.newsletter_subscribers
  add column if not exists confirm_token_hash text,
  add column if not exists confirm_expires_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists unsub_token text,
  add column if not exists unsubscribed_at timestamptz;
create unique index if not exists newsletter_confirm_hash_idx on public.newsletter_subscribers(confirm_token_hash);
create unique index if not exists newsletter_unsub_idx on public.newsletter_subscribers(unsub_token);

-- returns 'invalid' | 'send' (mail the confirm link) | 'confirmed' (already active, don't mail)
create or replace function public.cn_subscribe_v2(email text, confirm_hash text, unsub text) returns text
language plpgsql security definer set search_path = public as $$
declare st text;
begin
  if email is null or length(email) > 254 or email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'
     or confirm_hash !~ '^[0-9a-f]{64}$' or unsub !~ '^[0-9a-f]{64}$' then return 'invalid'; end if;
  select s.status into st from newsletter_subscribers s where s.email = lower(cn_subscribe_v2.email);
  if st = 'confirmed' then return 'confirmed'; end if;
  insert into newsletter_subscribers(email, status, confirm_token_hash, confirm_expires_at, unsub_token)
  values (lower(email), 'pending', confirm_hash, now() + interval '48 hours', unsub)
  on conflict (email) do update set status = 'pending', confirm_token_hash = excluded.confirm_token_hash,
    confirm_expires_at = excluded.confirm_expires_at, unsubscribed_at = null,
    unsub_token = coalesce(newsletter_subscribers.unsub_token, excluded.unsub_token);
  return 'send';
end $$;

-- the subscriber's unsub token (for building the link after upsert)
create or replace function public.cn_unsub_token(confirm_hash text) returns text
language sql security definer set search_path = public as $$
  select unsub_token from newsletter_subscribers where confirm_token_hash = confirm_hash $$;

create or replace function public.cn_confirm(confirm_hash text) returns text
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update newsletter_subscribers set status = 'confirmed', confirmed_at = now(), confirm_token_hash = null, confirm_expires_at = null
  where confirm_token_hash = confirm_hash and confirm_expires_at > now();
  get diagnostics n = row_count;
  return case when n > 0 then 'confirmed' else 'invalid' end;
end $$;

create or replace function public.cn_unsubscribe(unsub text) returns text
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update newsletter_subscribers set status = 'unsubscribed', unsubscribed_at = now(), confirm_token_hash = null, confirm_expires_at = null
  where unsub_token = unsub and unsub ~ '^[0-9a-f]{64}$';
  get diagnostics n = row_count;
  return case when n > 0 then 'unsubscribed' else 'invalid' end;
end $$;

revoke execute on function public.cn_subscribe_v2(text,text,text), public.cn_unsub_token(text), public.cn_confirm(text), public.cn_unsubscribe(text) from public, anon, authenticated;
grant execute on function public.cn_subscribe_v2(text,text,text), public.cn_unsub_token(text), public.cn_confirm(text), public.cn_unsubscribe(text) to service_role;
