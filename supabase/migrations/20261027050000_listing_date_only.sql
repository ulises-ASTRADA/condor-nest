-- Date-only fields (no published hour) and an optional status note, kept in listings.raw by curators.
-- anon cannot read raw (20261016150000), so expose ONLY these four keys as read-only generated columns.
-- PREPARED, NOT APPLIED: needs Sentinel review + owner OK. The site falls back to LISTING_COLS if these columns are missing.
alter table public.listings
  add column if not exists start_date    text generated always as (raw->>'start_date') stored,
  add column if not exists end_date      text generated always as (raw->>'end_date') stored,
  add column if not exists deadline_date text generated always as (raw->>'deadline_date') stored,
  add column if not exists status_note   text generated always as (raw->>'status_note') stored;
grant select (start_date, end_date, deadline_date, status_note) on public.listings to anon, authenticated;
-- Format (YYYY-MM-DD) and "only when the timestamp is null" are enforced in lib/types.ts fromRow.
