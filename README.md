# Condor Nest

A Spanish-first opportunity discovery platform for Latin American builders. Condor Nest brings hackathons, bounties, and grants into one searchable feed, with eligibility, deadlines, and ranking signals that help visitors decide where to spend their time.

[Live site](https://condor-nest.lat)

![Condor Nest desktop interface](docs/screenshot-desktop.png)

## Product and engineering scope

- Aggregate opportunities from Superteam Earn, Devpost, and Taikai, alongside manually verified listings.
- Filter by opportunity type, modality, and ecosystem; show deadlines in the visitor's local time zone.
- Rank opportunities using reward and participation data. These signals are heuristics, not predictions of winning.
- Provide detail pages, calendar exports, organizer information, newsletter signup, and an opportunity submission flow.
- Support discoverability with metadata, JSON-LD, sitemaps, and IndexNow notifications.

## Architecture

```text
External opportunity sources → scheduled ingestion → Supabase Postgres
                                                        ↓
Visitors → Next.js pages / route handlers → filtered and ranked listings
                       ↓
             Newsletter and submission flows → Resend
```

**Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Motion, Supabase/Postgres, Resend, and Vercel Cron.

| Area | Where to review |
| --- | --- |
| Ingestion and source normalization | `lib/ingest.ts`, `app/api/cron/ingest/route.ts` |
| Ranking logic and tests | `lib/rank.ts`, `lib/rank.test.ts` |
| Browsing and detail experience | `components/Feed.tsx`, `app/o/[slug]/page.tsx` |
| Newsletter and submissions | `app/api/newsletter/`, `app/api/publicar/` |
| Database access and security changes | `lib/server-supabase.ts`, `supabase/migrations/` |

The database migrations document changes to row-level security, confirmation flows, unsubscribe tokens, and durable rate limits. Those files describe the intended database configuration; a deployment must apply them to receive those protections.

## Run locally

```bash
git clone https://github.com/ulises-ASTRADA/condor-nest.git
cd condor-nest
npm ci
cp .env.example .env.local
# Supply your own Supabase and service credentials.
npm run dev
```

Open `http://localhost:3000`. A working Supabase project and the expected database schema are required for data-backed features. The migration directory contains incremental changes rather than a guaranteed one-command bootstrap of a new database.

| Configuration | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase client configuration |
| `SUPABASE_SERVICE_ROLE_KEY`, `INGEST_TOKEN` | Server ingestion and database operations |
| `CRON_SECRET` | Scheduled route authorization |
| `SITE_URL` | Canonical site origin and email links |
| `RESEND_API_KEY`, `RESEND_FROM`, `PUBLICAR_NOTIFY_TO` | Email delivery and submission notifications |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Optional anti-bot integration |
| `AFFILIATE_URL` | Optional affiliate destination |

Keep server credentials outside version control and never prefix them with `NEXT_PUBLIC_`. The IndexNow key and its verification file are intentionally public.

## Validation and operations

```bash
npm test         # Ranking tests
npm run build    # Production build
```

`vercel.json` schedules ingestion daily at 11:00 UTC. Source availability and platform scheduling behavior affect freshness. Curated listings should be checked against their official source; see [the curation procedure](docs/x-sweep.md).

Newsletter delivery requires verified Resend configuration. Affiliate links may generate a commission. The background audio has a separate [license note](public/audio/LICENSE.md).

## Review focus

This project demonstrates full-stack product development: API ingestion, relational data modeling, ranking, user-facing discovery, email workflows, and deployment configuration. Production traffic, conversion, and uptime claims are intentionally omitted because they are not established by the source code.
