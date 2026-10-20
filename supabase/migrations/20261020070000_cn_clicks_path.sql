-- /go/<slug> click counter: also store the PATH of the condor-nest page where the click happened
-- (e.g. /o/hackatwin-2026, /hackathons-argentina, /). Pathname only: no query, no fragment, no host.
-- Set only when the Referer is condor-nest itself (checked in the app); otherwise NULL. Not personal data.
-- Touches only Condor Nest objects: cn_clicks and cn_record_click.

alter table public.cn_clicks add column if not exists referrer_path text;
alter table public.cn_clicks drop constraint if exists cn_clicks_referrer_path_check;
alter table public.cn_clicks add constraint cn_clicks_referrer_path_check
  check (referrer_path is null or (length(referrer_path) between 1 and 200 and referrer_path ~ '^/[A-Za-z0-9/_.-]*$'));

-- Replace the 2-arg insert function with a 3-arg one (old signature dropped so only one exists).
drop function if exists public.cn_record_click(uuid, text);
create or replace function public.cn_record_click(p_listing uuid, p_ref text, p_path text) returns void
language plpgsql security definer set search_path = public as $$
declare
  ref text := lower(nullif(p_ref, ''));
  pth text := nullif(p_path, '');
begin
  if ref is not null and (length(ref) > 253 or ref !~ '^[a-z0-9.-]+$') then ref := null; end if;
  if pth is not null and (length(pth) > 200 or pth !~ '^/[A-Za-z0-9/_.-]*$') then pth := null; end if;
  insert into cn_clicks(listing_id, listing_slug, referrer_domain, referrer_path)
  select l.id, l.slug, ref, pth from listings l where l.id = p_listing and l.in_latam;
end $$;
revoke all on function public.cn_record_click(uuid, text, text) from public, anon, authenticated;
grant execute on function public.cn_record_click(uuid, text, text) to service_role;
