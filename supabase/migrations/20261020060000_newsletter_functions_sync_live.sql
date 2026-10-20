-- Sync repo with the live DB (read via pg_get_functiondef on 2026-10-20). No-op against current prod:
-- recreates cn_confirm, cn_subscribe_v2 and cn_unsubscribe exactly as deployed (hashed tokens), same grants.

CREATE OR REPLACE FUNCTION public.cn_confirm(confirm_hash text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n int;
begin
  update newsletter_subscribers set status = 'confirmed', confirmed_at = now(), confirm_token_hash = null, confirm_expires_at = null
  where confirm_token_hash = confirm_hash and confirm_expires_at > now();
  get diagnostics n = row_count;
  return case when n > 0 then 'confirmed' else 'invalid' end;
end $function$;

CREATE OR REPLACE FUNCTION public.cn_subscribe_v2(email text, confirm_hash text, unsub_hash text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.cn_unsubscribe(unsub text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n int;
begin
  if unsub !~ '^[0-9a-f]{64}$' then return 'invalid'; end if;
  update newsletter_subscribers set status = 'unsubscribed', unsubscribed_at = now(), confirm_token_hash = null, confirm_expires_at = null
  where unsub_token_hash = encode(sha256(convert_to(unsub, 'UTF8')), 'hex');
  get diagnostics n = row_count;
  return case when n > 0 then 'unsubscribed' else 'invalid' end;
end $function$;

-- Live ACL: {postgres=X/postgres,service_role=X/postgres}
REVOKE ALL ON FUNCTION public.cn_confirm(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cn_subscribe_v2(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cn_unsubscribe(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cn_confirm(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cn_subscribe_v2(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cn_unsubscribe(text) TO service_role;
