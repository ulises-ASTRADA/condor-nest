-- Short card label for eligibility (applied 2026-10-14 via MCP, together with values for current listings).
alter table public.listings add column if not exists eligibility_short text check (eligibility_short is null or char_length(eligibility_short) <= 32);
comment on column public.listings.eligibility_short is 'Short eligibility label for cards (<= ~28 chars). Full text stays in eligibility_note.';
