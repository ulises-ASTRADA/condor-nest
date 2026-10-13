-- Condor Nest security hardening (2026-10-13).
-- PART A is safe with the currently deployed app. Applied live 2026-10-13, EXCEPT listings_https_urls (deferred).
-- PART B must be applied ONLY AFTER deploying the security-fixes branch with SUPABASE_SERVICE_ROLE_KEY set.

-- ===== PART A: table grants (deployed app only needs anon SELECT on listings + ingest_runs) =====
revoke all on public.listings, public.ingest_runs, public.newsletter_subscribers, public.cn_secrets from anon, authenticated;
grant select on public.listings to anon, authenticated;
grant select on public.ingest_runs to anon, authenticated; -- removed in PART B
-- public ingest status exposes only ran_at of successful runs. Default privileges grant ALL on new
-- relations, and a simple view is auto-updatable and owner-run, so revoke ALL before granting SELECT.
create or replace view public.cn_last_ingest as select ran_at from public.ingest_runs where error is null;
revoke all on public.cn_last_ingest from anon, authenticated;
grant select on public.cn_last_ingest to anon, authenticated;
-- https-only links (NOT VALID: checks new/updated rows only; existing rows already verified https)
alter table public.listings add constraint listings_https_urls check (
  (source_url is null or source_url ~ '^https://') and (apply_url is null or apply_url ~ '^https://')
  and (verified_url is null or verified_url ~ '^https://') and (source_post_url is null or source_post_url ~ '^https://')) not valid;

drop policy if exists "public read" on public.ingest_runs;
revoke select on public.ingest_runs from anon, authenticated;

-- B2. RPCs only callable with the server-only key
revoke execute on function public.cn_subscribe(text) from public, anon, authenticated;
revoke execute on function public.cn_ingest(text, text, jsonb, integer, text) from public, anon, authenticated;
grant execute on function public.cn_subscribe(text), public.cn_ingest(text, text, jsonb, integer, text) to service_role;

-- B3. cn_subscribe: length cap, no enumeration
create or replace function public.cn_subscribe(email text) returns text
language plpgsql security definer set search_path = public as $$
begin
  if email is null or length(email) > 254 or email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then return 'invalid'; end if;
  insert into newsletter_subscribers(email) values (lower(email)) on conflict do nothing;
  return 'success';
end $$;

-- B4. ingest token -> Supabase Vault (read via vault.decrypted_secrets), constant-length digest compare
select vault.create_secret((select value from public.cn_secrets where name = 'ingest_token'), 'cn_ingest_token')
where not exists (select 1 from vault.secrets where name = 'cn_ingest_token');
-- Then edit cn_ingest's token check to:
--   if token is null or digest(token,'sha256') <> digest((select decrypted_secret from vault.decrypted_secrets where name='cn_ingest_token'),'sha256') then raise exception 'unauthorized'; end if;
-- (requires pgcrypto in schema extensions; add 'extensions' to its search_path) and https-filter rows, then:
-- delete from public.cn_secrets where name = 'ingest_token';
