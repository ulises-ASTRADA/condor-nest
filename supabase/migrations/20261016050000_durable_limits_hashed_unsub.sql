-- Durable rate limits (DB-backed), hashed unsubscribe tokens, drop legacy cn_subscribe(text).
-- Touches only Condor Nest objects (cn_* functions, newsletter_subscribers, cn_submissions).

-- 1) Unsubscribe tokens stored as sha256 hex. Existing links keep working: the RPC hashes the incoming token.
alter table public.newsletter_subscribers add column if not exists unsub_token_hash text;
update public.newsletter_subscribers set unsub_token_hash = encode(sha256(convert_to(unsub_token, 'UTF8')), 'hex')
  where unsub_token is not null and unsub_token_hash is null;
update public.newsletter_subscribers set unsub_token = null where unsub_token_hash is not null;
create unique index if not exists newsletter_unsub_hash_idx on public.newsletter_subscribers(unsub_token_hash);

-- 2) Subscribe: 'invalid' | 'send' | 'confirmed' | 'recent' (mail already sent to this address < 1 h) | 'rate' (global cap)
drop function if exists public.cn_subscribe_v2(text, text, text);
create function public.cn_subscribe_v2(email text, confirm_hash text, unsub_hash text) returns text
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare st text; last_mail timestamptz; e text := lower(cn_subscribe_v2.email);
begin
  if e is null or length(e) > 254 or e !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'
     or confirm_hash !~ '^[0-9a-f]{64}$' or unsub_hash !~ '^[0-9a-f]{64}$' then return 'invalid'; end if;
  select s.status, s.confirm_mail_at into st, last_mail from newsletter_subscribers s where s.email = e;
  if st = 'confirmed' then return 'confirmed'; end if;
  if last_mail is not null and last_mail > now() - interval '1 hour' then return 'recent'; end if;
  if (select count(*) from newsletter_subscribers where confirm_mail_at > now() - interval '1 hour') >= 60 then return 'rate'; end if;
  insert into newsletter_subscribers(email, status, confirm_token_hash, confirm_expires_at, unsub_token_hash, confirm_mail_at, confirm_mail_error)
  values (e, 'pending', confirm_hash, now() + interval '48 hours', unsub_hash, now(), null)
  on conflict (email) do update set status = 'pending', confirm_token_hash = excluded.confirm_token_hash,
    confirm_expires_at = excluded.confirm_expires_at, unsubscribed_at = null,
    unsub_token_hash = excluded.unsub_token_hash, confirm_mail_at = now(), confirm_mail_error = null;
  return 'send';
end $$;

create or replace function public.cn_unsubscribe(unsub text) returns text
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if unsub !~ '^[0-9a-f]{64}$' then return 'invalid'; end if;
  update newsletter_subscribers set status = 'unsubscribed', unsubscribed_at = now(), confirm_token_hash = null, confirm_expires_at = null
  where unsub_token_hash = encode(sha256(convert_to(unsub, 'UTF8')), 'hex');
  get diagnostics n = row_count;
  return case when n > 0 then 'unsubscribed' else 'invalid' end;
end $$;

drop function if exists public.cn_unsub_token(text);
drop function if exists public.cn_subscribe(text);

-- 3) Submissions: -1 = rate limited (same email >= 3/h, or >= 30/h overall)
create or replace function public.cn_submit(p jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare new_id bigint;
begin
  if (select count(*) from cn_submissions where email = lower(p->>'email') and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from cn_submissions where created_at > now() - interval '1 hour') >= 30 then return -1; end if;
  insert into cn_submissions(name,email,event_name,kind,location,dates,prize,url,notes,wants_featured)
  values (p->>'name', lower(p->>'email'), p->>'event_name', p->>'kind', p->>'location', p->>'dates',
          nullif(p->>'prize',''), p->>'url', nullif(p->>'notes',''), coalesce((p->>'wants_featured')::boolean,false))
  returning id into new_id;
  return new_id;
end $$;
alter table public.cn_submissions drop constraint if exists cn_submissions_url_check;
alter table public.cn_submissions add constraint cn_submissions_url_check check (length(url) <= 500 and url ~ '^https://') not valid;

revoke execute on function public.cn_subscribe_v2(text,text,text), public.cn_unsubscribe(text), public.cn_submit(jsonb) from public, anon, authenticated;
grant execute on function public.cn_subscribe_v2(text,text,text), public.cn_unsubscribe(text), public.cn_submit(jsonb) to service_role;
