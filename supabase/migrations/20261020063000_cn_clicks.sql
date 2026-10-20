-- Outbound click counter for the "Inscribirme" buttons (/go/<slug>).
-- Touches only new Condor Nest objects: table cn_clicks and function cn_record_click(uuid, text).
-- Privacy: one row per counted click with listing id/slug, time and referrer HOSTNAME only.
-- No IP, no user agent, no cookie value, nothing personal. Bot/prefetch/repeat filtering happens in the app before calling the RPC.

create table if not exists public.cn_clicks (
  id bigint generated always as identity primary key,
  listing_id uuid not null,            -- listings.id (no FK on purpose: history survives if a listing row is removed by ingest)
  listing_slug text not null check (length(listing_slug) between 1 and 200),
  clicked_at timestamptz not null default now(),
  referrer_domain text check (referrer_domain is null or (length(referrer_domain) <= 253 and referrer_domain ~ '^[a-z0-9.-]+$'))
);
create index if not exists cn_clicks_listing_time_idx on public.cn_clicks (listing_id, clicked_at);

-- RLS on, NO policies: anon/authenticated can neither read nor write. service_role bypasses RLS.
alter table public.cn_clicks enable row level security;
revoke all on table public.cn_clicks from public, anon, authenticated;
revoke all on sequence public.cn_clicks_id_seq from public, anon, authenticated;

-- Insert path for the server (service role). Records only clicks for an existing public listing.
create or replace function public.cn_record_click(p_listing uuid, p_ref text) returns void
language plpgsql security definer set search_path = public as $$
declare ref text := lower(nullif(p_ref, ''));
begin
  if ref is not null and (length(ref) > 253 or ref !~ '^[a-z0-9.-]+$') then ref := null; end if;
  insert into cn_clicks(listing_id, listing_slug, referrer_domain)
  select l.id, l.slug, ref from listings l where l.id = p_listing and l.in_latam;
end $$;
revoke execute on function public.cn_record_click(uuid, text) from public, anon, authenticated;
grant execute on function public.cn_record_click(uuid, text) to service_role;
