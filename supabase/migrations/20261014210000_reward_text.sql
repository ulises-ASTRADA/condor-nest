-- Prize description from the official page (applied 2026-10-14 via MCP, with the reward audit data fixes).
alter table public.listings add column if not exists reward_text text;
comment on column public.listings.reward_text is 'Prize description copied from the official page (es). Shown when no amount, or as detail.';
