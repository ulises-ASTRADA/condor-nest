-- Sentinel lows: advisory locks around the rate-limit checks; drop the now-empty plaintext unsub_token column.
create or replace function public.cn_subscribe_v2(email text, confirm_hash text, unsub_hash text) returns text
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare st text; last_mail timestamptz; e text := lower(cn_subscribe_v2.email);
begin
  if e is null or length(e) > 254 or e !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'
     or confirm_hash !~ '^[0-9a-f]{64}$' or unsub_hash !~ '^[0-9a-f]{64}$' then return 'invalid'; end if;
  perform pg_advisory_xact_lock(hashtext('cn_subscribe_v2'));  -- serialize limit checks
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


create or replace function public.cn_submit(p jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare new_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('cn_submit'));  -- serialize limit checks
  if (select count(*) from cn_submissions where email = lower(p->>'email') and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from cn_submissions where created_at > now() - interval '1 hour') >= 30 then return -1; end if;
  insert into cn_submissions(name,email,event_name,kind,location,dates,prize,url,notes,wants_featured)
  values (p->>'name', lower(p->>'email'), p->>'event_name', p->>'kind', p->>'location', p->>'dates',
          nullif(p->>'prize',''), p->>'url', nullif(p->>'notes',''), coalesce((p->>'wants_featured')::boolean,false))
  returning id into new_id;
  return new_id;
end $$;

do $$ begin
  if exists (select 1 from public.newsletter_subscribers where unsub_token is not null) then raise exception 'unsub_token not empty'; end if;
end $$;
drop index if exists public.newsletter_unsub_idx;
alter table public.newsletter_subscribers drop column if exists unsub_token;
