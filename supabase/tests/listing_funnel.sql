-- Run against a disposable local DB after the migration. All fixtures roll back.
begin;
do $$
declare
  listing uuid := gen_random_uuid(); other_listing uuid := gen_random_uuid();
  entry uuid := gen_random_uuid(); fast_entry uuid := gen_random_uuid(); paid uuid;
  slug text := 'qa-analytics-' || replace(listing::text,'-','');
  other_slug text := 'qa-analytics-' || replace(other_listing::text,'-','');
  impression jsonb; click jsonb; detail jsonb; result record;
begin
  -- Use existing public fixture listings; avoid assumptions about required production listing columns.
  select id, listings.slug into listing,slug from public.listings where in_latam order by id limit 1;
  select id, listings.slug into other_listing,other_slug from public.listings where in_latam and id<>listing order by id limit 1;
  if listing is null or other_listing is null then raise exception 'Two local listing fixtures are required'; end if;
  insert into cn_promotion_campaigns(listing_id,starts_at,ends_at,paid_usd_cents)
    values(listing,now()-interval '1 day',now()+interval '1 day',1900) returning id into paid;
  begin
    insert into cn_promotion_campaigns(listing_id,starts_at,ends_at) values(listing,now(),now()+interval '2 days');
    raise exception 'Overlapping campaign accepted';
  exception when raise_exception then
    if sqlerrm<>'Overlapping promotion campaign' then raise; end if;
  end;
  impression := jsonb_build_object('id',gen_random_uuid(),'kind','impression','slug',slug,'path','/','placement','featured','position',1,'exposure',entry);
  click := impression || jsonb_build_object('id',gen_random_uuid(),'kind','card_click');
  detail := jsonb_build_object('id',gen_random_uuid(),'kind','detail_view','slug',slug,'path','/o/'||slug,'placement','detail','position',null,'exposure',entry);
  perform cn_record_listing_events(jsonb_build_array(impression,click,detail),array[slug]);
  perform cn_record_listing_events(jsonb_build_array(impression,click),array[slug]);
  -- A new UUID cannot duplicate the click for the same exposure.
  perform cn_record_listing_events(jsonb_build_array(click || jsonb_build_object('id',gen_random_uuid())),array[slug]);
  if (select count(*) from cn_listing_events where exposure_id=entry)<>3 then raise exception 'Retry duplicated events'; end if;
  if not exists(select 1 from cn_listing_events where exposure_id=entry and kind='card_click' and campaign_id=paid) then raise exception 'Paid campaign snapshot missing'; end if;
  perform cn_record_click(listing,'condor-nest.lat','/o/'||slug,entry);
  if not exists(select 1 from cn_clicks where listing_id=listing and entry_exposure_id=entry and placement='featured' and campaign_id=paid) then raise exception 'Outbound attribution missing'; end if;
  -- Forged, unrelated and expired entries still count as ordinary outbound clicks, never campaign clicks.
  perform cn_record_click(other_listing,'condor-nest.lat','/o/'||other_slug,entry);
  if exists(select 1 from cn_clicks where listing_id=other_listing and entry_exposure_id=entry) then raise exception 'Cross-listing attribution accepted'; end if;
  perform cn_record_click(listing,null,null,gen_random_uuid());
  if not exists(select 1 from cn_clicks where listing_id=listing and referrer_path is null and entry_exposure_id is null) then raise exception 'Direct outbound lost'; end if;
  perform cn_record_listing_events(jsonb_build_array(click || jsonb_build_object('id',gen_random_uuid(),'slug',other_slug)),array[other_slug]);
  if exists(select 1 from cn_listing_events where exposure_id=entry and listing_id=other_listing) then raise exception 'Exposure reused across listings'; end if;
  -- Fast click without a one-second view remains visible in raw clicks but not viewable CTR.
  perform cn_record_listing_events(jsonb_build_array(click || jsonb_build_object('id',gen_random_uuid(),'exposure',fast_entry)),array[slug]);
  select * into result from cn_listing_funnel_daily where listing_id=listing and campaign_id=paid and placement='featured' and position=1;
  if result.impressions<>1 or result.card_clicks<>2 or result.viewable_card_clicks<>1 or result.card_ctr_percent<>100 or result.detail_views<>1 or result.outbound_clicks<>1 then
    raise exception 'Funnel counts or CTR inflated: %',row_to_json(result);
  end if;
  update cn_listing_events set recorded_at=now()-interval '31 minutes' where exposure_id=entry;
  perform cn_record_click(listing,null,'/o/'||slug,entry);
  if (select count(*) from cn_clicks where entry_exposure_id=entry)<>1 then raise exception 'Expired entry attributed'; end if;
  -- Compatible pre-instrumentation RPC continues working.
  perform cn_record_click(listing,null,'/o/'||slug);
  if has_table_privilege('anon','public.cn_listing_events','select')
    or has_table_privilege('authenticated','public.cn_listing_funnel_daily','select')
    or has_function_privilege('anon','public.cn_record_listing_events(jsonb,text[])','execute') then raise exception 'Private analytics exposed'; end if;
end $$;
set local role service_role;
select * from public.cn_listing_funnel_daily limit 1;
reset role;
rollback;
