-- Condor Nest: "Sobre {empresa}" block. Text comes only from the organizer's own site / X bio, with its source URL.
-- No anon/authenticated grant on these columns (column-level grants since 20261016150000): read server-side only.
alter table public.listings
  add column if not exists organizer_description text,
  add column if not exists organizer_source_url text,
  add column if not exists organizer_website text;
alter table public.listings
  add constraint listings_org_desc_len check (organizer_description is null or (char_length(organizer_description) between 1 and 200 and organizer_description !~* 'a completar')),
  add constraint listings_org_source_https check (organizer_source_url is null or organizer_source_url ~ '^https://[^\s<>"]+$'),
  add constraint listings_org_website_https check (organizer_website is null or organizer_website ~ '^https://[^\s<>"]+$'),
  add constraint listings_org_desc_needs_source check (organizer_description is null or organizer_source_url is not null);
revoke select (organizer_description, organizer_source_url, organizer_website) on public.listings from anon, authenticated;
