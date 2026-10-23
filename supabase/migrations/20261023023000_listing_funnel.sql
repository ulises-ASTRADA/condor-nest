-- Anonymous public listing funnel. No visitor IDs, IPs, UA, query strings or contact data.
-- Private campaign registry: an editorial featured placement is NOT automatically a paid campaign.
create table public.cn_promotion_campaigns (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  paid_usd_cents integer check (paid_usd_cents is null or paid_usd_cents >= 0),
  check (ends_at > starts_at)
);
create index cn_promotion_campaigns_listing_idx on public.cn_promotion_campaigns(listing_id, starts_at, ends_at);
alter table public.cn_promotion_campaigns enable row level security;
revoke all on public.cn_promotion_campaigns from public, anon, authenticated;
grant all on public.cn_promotion_campaigns to service_role;

-- Serialize campaign edits per listing, rejecting ambiguous overlapping windows.
create function public.cn_campaign_no_overlap() returns trigger
language plpgsql set search_path = public as $$
begin
  perform 1 from listings where id = new.listing_id for update;
  if exists(select 1 from cn_promotion_campaigns c where c.listing_id = new.listing_id and c.id <> new.id
    and c.starts_at < new.ends_at and c.ends_at > new.starts_at) then
    raise exception 'Overlapping promotion campaign';
  end if;
  return new;
end $$;
revoke all on function public.cn_campaign_no_overlap() from public, anon, authenticated;
create trigger cn_campaign_no_overlap before insert or update on public.cn_promotion_campaigns
for each row execute function public.cn_campaign_no_overlap();

create table public.cn_listing_events (
  id uuid primary key,
  kind text not null check (kind in ('impression','card_click','detail_view')),
  exposure_id uuid,
  listing_id uuid not null,
  listing_slug text not null,
  recorded_at timestamptz not null default now(),
  page_path text not null,
  placement text not null check (placement in ('featured','organic','related','detail')),
  position smallint,
  featured_snapshot boolean not null,
  featured_until_snapshot timestamptz,
  campaign_id uuid,
  check ((kind = 'detail_view' and placement = 'detail' and position is null)
    or (kind <> 'detail_view' and placement <> 'detail' and position is not null and position between 1 and 500 and exposure_id is not null)),
  check (page_path in ('/','/hackathons-argentina','/hackathons-mexico','/hackathons-chile','/hackathons-ia','/hackathons-online','/bounties','/grants')
    or page_path ~ '^/o/[A-Za-z0-9_-]{1,200}$')
);
create unique index cn_listing_events_exposure_kind_idx on public.cn_listing_events(exposure_id,kind) where kind <> 'detail_view';
create index cn_listing_events_listing_time_idx on public.cn_listing_events(listing_id,recorded_at);
create index cn_listing_events_entry_idx on public.cn_listing_events(exposure_id,listing_id,recorded_at);
alter table public.cn_listing_events enable row level security;
revoke all on public.cn_listing_events from public, anon, authenticated;
grant all on public.cn_listing_events to service_role;

create function public.cn_record_listing_events(p_events jsonb, p_editorial_slugs text[] default '{}') returns void
language plpgsql security definer set search_path = public as $$
declare e jsonb; l public.listings%rowtype; featured_now boolean; campaign uuid; previous public.cn_listing_events%rowtype; expiry timestamptz;
begin
  if jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) not between 1 and 20 then
    raise exception 'Invalid event batch';
  end if;
  for e in select value from jsonb_array_elements(p_events) loop
    select * into l from listings where slug = e->>'slug' and in_latam;
    if not found then continue; end if;
    featured_now := coalesce((l.featured and (l.featured_until is null or l.featured_until > now())) or l.slug = any(p_editorial_slugs), false);
    if e->>'placement' = 'featured' and (e->>'path' <> '/' or not featured_now) then continue; end if;
    if e->>'placement' = 'organic' and e->>'path' like '/o/%' then continue; end if;
    if e->>'placement' = 'related' and e->>'path' not like '/o/%' then continue; end if;
    if e->>'kind' = 'detail_view' and e->>'path' <> ('/o/' || l.slug) then continue; end if;
    campaign := null;
    if e->>'placement' = 'featured' then
      select id into campaign from cn_promotion_campaigns where listing_id = l.id and starts_at <= now() and ends_at > now();
    end if;
    -- Serialize writes for the same opaque exposure; concurrent retries cannot mix listings/slots.
    perform pg_advisory_xact_lock(hashtextextended('cn-listing-exposure:' || coalesce(e->>'exposure',e->>'id'),0));
    -- An exposure cannot be reused to attach another listing or placement to its click.
    if exists(select 1 from cn_listing_events old where old.exposure_id = (e->>'exposure')::uuid
      and old.kind <> 'detail_view' and e->>'kind' <> 'detail_view'
      and (old.listing_id <> l.id or old.placement <> e->>'placement' or old.page_path <> e->>'path' or old.position <> (e->>'position')::smallint)) then continue; end if;
    expiry := l.featured_until;
    if e->>'kind' <> 'detail_view' then
      select * into previous from cn_listing_events where exposure_id=(e->>'exposure')::uuid and kind <> 'detail_view' limit 1;
      if found then
        featured_now := previous.featured_snapshot; expiry := previous.featured_until_snapshot; campaign := previous.campaign_id;
      end if;
    end if;
    insert into cn_listing_events(id,kind,exposure_id,listing_id,listing_slug,page_path,placement,position,featured_snapshot,featured_until_snapshot,campaign_id)
    values ((e->>'id')::uuid,e->>'kind',(e->>'exposure')::uuid,l.id,l.slug,e->>'path',e->>'placement',(e->>'position')::smallint,featured_now,expiry,campaign)
    on conflict do nothing;
  end loop;
end $$;
revoke all on function public.cn_record_listing_events(jsonb,text[]) from public, anon, authenticated;
grant execute on function public.cn_record_listing_events(jsonb,text[]) to service_role;

alter table public.cn_clicks
  add column entry_exposure_id uuid,
  add column placement text,
  add column placement_path text,
  add column placement_position smallint,
  add column campaign_id uuid,
  add column featured_snapshot boolean,
  add column featured_until_snapshot timestamptz;
create index cn_clicks_exposure_idx on public.cn_clicks(entry_exposure_id);
grant select on public.cn_clicks to service_role;

-- Preserve the existing 3-argument function: old code and historical click totals remain compatible.
create function public.cn_record_click(p_listing uuid, p_ref text, p_path text, p_exposure uuid) returns void
language plpgsql security definer set search_path = public as $$
declare ref text := lower(nullif(p_ref,'')); pth text := nullif(p_path,''); entry public.cn_listing_events%rowtype;
begin
  if ref is not null and (length(ref)>253 or ref !~ '^[a-z0-9.-]+$') then ref:=null; end if;
  if pth is not null and (length(pth)>200 or pth !~ '^/[A-Za-z0-9/_.-]*$') then pth:=null; end if;
  select * into entry from cn_listing_events where kind='card_click' and exposure_id=p_exposure and listing_id=p_listing
    and recorded_at > now()-interval '30 minutes';
  insert into cn_clicks(listing_id,listing_slug,referrer_domain,referrer_path,entry_exposure_id,placement,placement_path,
    placement_position,campaign_id,featured_snapshot,featured_until_snapshot)
  select l.id,l.slug,ref,pth,entry.exposure_id,entry.placement,entry.page_path,entry.position,entry.campaign_id,
    entry.featured_snapshot,entry.featured_until_snapshot from listings l where l.id=p_listing and l.in_latam;
end $$;
revoke all on function public.cn_record_click(uuid,text,text,uuid) from public, anon, authenticated;
grant execute on function public.cn_record_click(uuid,text,text,uuid) to service_role;

-- Cohort reporting: day = first exposure event (UTC), not the day a later registration click happened.
-- CTR uses only clicks with a matching viewable impression; fast clicks are reported separately.
create view public.cn_listing_funnel_daily with (security_invoker=true) as
with first_exposure as (
  select distinct on (exposure_id) * from cn_listing_events where kind <> 'detail_view' order by exposure_id,recorded_at,id
), funnel as (
  select f.*, exists(select 1 from cn_listing_events e where e.exposure_id=f.exposure_id and e.kind='impression') as viewed,
    exists(select 1 from cn_listing_events e where e.exposure_id=f.exposure_id and e.kind='card_click') as clicked,
    (select count(*) from cn_listing_events d where d.kind='detail_view' and d.exposure_id=f.exposure_id and d.listing_id=f.listing_id
      and exists(select 1 from cn_listing_events c where c.kind='card_click' and c.exposure_id=f.exposure_id and c.listing_id=f.listing_id
        and d.recorded_at between c.recorded_at and c.recorded_at+interval '30 minutes')) as detail_views,
    (select count(*) from cn_clicks c where c.entry_exposure_id=f.exposure_id and c.listing_id=f.listing_id) as outbound_clicks
  from first_exposure f
)
select (recorded_at at time zone 'UTC')::date as cohort_day_utc, listing_id,listing_slug,page_path,placement,position,campaign_id,
  count(*) filter(where viewed) as impressions, count(*) filter(where clicked) as card_clicks,
  count(*) filter(where viewed and clicked) as viewable_card_clicks,
  round(100.0 * count(*) filter(where viewed and clicked) / nullif(count(*) filter(where viewed),0),2) as card_ctr_percent,
  sum(detail_views) as detail_views, sum(outbound_clicks) as outbound_clicks
from funnel group by 1,2,3,4,5,6,7;
revoke all on public.cn_listing_funnel_daily from public, anon, authenticated;
grant select on public.cn_listing_funnel_daily to service_role;
