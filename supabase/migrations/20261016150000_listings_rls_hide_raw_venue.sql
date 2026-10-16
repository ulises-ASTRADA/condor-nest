-- listings is Condor Nest-only (public schema has only cn tables; Vitalia doesn't use it).
-- 1) Venue fields from real source data (shown in Event location).
alter table public.listings add column if not exists venue text, add column if not exists venue_locality text;
-- 2) Anon/authenticated can read only LatAm rows.
drop policy if exists "public read" on public.listings;
create policy "public read latam" on public.listings for select to anon, authenticated using (in_latam);
-- 3) Hide raw scraped JSON: column-level SELECT for every column except raw.
revoke select on public.listings from anon, authenticated;
do $$ declare cols text; begin
  select string_agg(quote_ident(column_name), ',') into cols from information_schema.columns
   where table_schema='public' and table_name='listings' and column_name <> 'raw';
  execute format('grant select (%s) on public.listings to anon, authenticated', cols);
end $$;
-- NOTE: new columns added later need an explicit grant select (col) to anon.
