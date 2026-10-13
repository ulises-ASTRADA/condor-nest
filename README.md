# Condor Nest
Spanish-first feed of hackathons, bounties and grants for LatAm builders. Next.js 15 (App Router, TS) + Supabase + Vercel cron.
- Daily ingest: `/api/cron/ingest` (Superteam Earn, Devpost, Taikai) via `vercel.json` cron, deduped on `(source, external_id)`.
- Curated events (Luma/X) are seeded only after verification on the official page (`verified_url`).
- Env: see `.env.example`.
