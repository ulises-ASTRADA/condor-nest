# X sweep procedure for curated LatAm hackathons (Condor Nest)
Date: 2026-10-13 · Author: Landing Express (Grok Bot)
Sources: x namespace tools (search_posts_all, get_posts_by_ids) · https://interledger.org/hackathon/overview/ · https://live.eventtia.com/es/build-the-future-of-finance · https://aplicaciones2.iecm.mx/HackatonCivico/ · https://luma.com/3qmbyb6h · https://superteam.fun/earn/listing/colosseum-crypto-worlds-fair-hackathon-superteam-argentina-track

Summary: X is a discovery source, not a source of truth. Find posts with ~4 searches, open the link in each post, and list an event only after its official page confirms the date, place and who can join. Store the post in `source_post_url` and the official page in `verified_url` (DB check requires verified_url when curated=true).

## Steps v2 (upgraded 2026-10-13 · about 6–8 x calls per sweep; limits 30/min, 1000/day, 25 results/call)
Use `search_posts_all` with `start_time` = 30 days ago, `max_results` 25, `post.fields=created_at,entities,note_tweet,author_id`, `expansions=author_id`, `user.fields=username`, `write_to_file: true`, then parse the file with python (print date, @user, id, 150 chars, expanded URLs).

**Spelling block (S):** `(hackathon OR hackaton OR hackatón OR hackatones OR hackathons OR buildathon OR ideatón OR ideaton OR "hack day" OR "game jam")`. Add `OR bounty OR grant OR grants` only on the account query, because they're too noisy on place queries.

**Queries. Each one is a single call that ANDs two OR groups. Never put a generic word like inscripciones in the same OR group as the event words.**
1. AR (relevancy): `S (#BA OR #Techweek OR #BuenosAires OR Argentina OR "Buenos Aires" OR Córdoba OR Rosario OR Mendoza) -is:retweet`
2. Rest of LatAm (relevancy): `S (#CDMX OR #Bogotá OR #Bogota OR #Santiago OR #SaoPaulo OR #LatAm OR CDMX OR México OR Bogotá OR Medellín OR Santiago OR Chile OR Lima OR Perú OR Montevideo OR Uruguay OR "São Paulo") -is:retweet`
3. Accounts (recency): `(S OR bounty OR grant OR grants) (from:mbeaudroit OR from:lucasmcasp OR from:belo_app OR from:SuperteamAR OR from:SuperteamLATAM OR from:SuperteamBR OR from:SuperteamMX OR from:superteamCL OR from:ethlatam OR from:RipioApp OR from:ripiohq OR from:LaChain_Network OR from:twinfinance_ OR from:crecimientoar OR from:labitconf OR from:EthereumArg OR from:ETHKipu OR from:CeloDevs OR from:Interledger)`. Keep the query under 1024 characters and split the account list into two calls if it grows.
4. Open calls (recency, 3 weeks): `S (inscripciones OR inscribite OR inscríbete OR register OR apply) (LatAm OR Latinoamérica OR Argentina OR México OR Colombia OR Chile OR Perú OR Uruguay OR #LatAm) -is:retweet`
5. Brazil (relevancy): `(hackathon OR hackathons OR buildathon OR "game jam") (Brasil OR "São Paulo" OR #SaoPaulo OR "Rio de Janeiro" OR "Belo Horizonte" OR Florianópolis) -is:retweet`. Lesson: the v2 first run mixed inscrições into the event group and got only noise (courses, internships).
6. Expand candidates: `get_posts_by_ids` (up to 100 ids per call) with `post.fields=note_tweet,entities`. Truncated posts keep the real link in `note_tweet.entities.urls[].expanded_url` (for example the belo post had agentic.belo.app/hackaton only there). Also read replies and threads (`conversation_id`) when the post says "link abajo".
7. Verify on the official page (curl, then strip HTML; the box browser if blocked). Reject: Google, Tally or Typeform forms with no official page; linktree-only; registration closed; already finished; dates without a year. LatAm rule: held in LatAm OR eligibility explicitly restricted to LatAm or a LatAm country. A LatAm-themed track of a global hackathon (for example Celo "Stable Agents: LatAm") doesn't count.
8. Seed or update in Supabase `public.listings` (project ifcmfxqqiecudxaqddba): `curated=true`, `in_latam=true`, `source_post_url` (main post), `verified_url`, `verified_at=now()`, `apply_url`. Put extra posts in `raw.source_posts`. Only fill fields the official page states; otherwise leave them null.
9. Daily routine: run steps 1–5 with `start_time` = last sweep date (since_id where possible), dedupe by post id, then steps 6–8. Log candidates you rejected, with the reason, at the bottom of this doc so they get re-checked.

## Sweep v2 results (2026-10-13 ~03:10 ART)
- **belo hackathon updated.** The signup link is https://agentic.belo.app/hackaton (form at #inscripcion), from https://x.com/mbeaudroit/status/2106439716975391203 (note_tweet URL). Official page: "belo buildathon · Agentic Banking / Buildathon 001", Wed 28 Oct 2026, 10:00–20:00, at belo's Buenos Aires offices, 50 spots, 10 teams of 5 formed by belo, individual signup (doesn't guarantee a spot), prizes for the top 3 ideas (details TBA). Post: Techweek BA.
- New and not seeded: PUMM 2026 / HackaPUMM (Oct 14, C Art Media CABA, girls 13–23; the hackathon is for already-applied CET community teams, so there's no open signup), Women Game Jam Argentina Oct 16–18 (@womeningamesAR; Tally form + linktree only, official site unreachable; re-check), Celo "Agents on Open Rails" Stable Agents: LatAm track ($2k, global hackathon, not LatAm-restricted), Stellar Odyssey Perú (already judging), wear+D 2k26 CDMX (Sept 24–26, finished), Release Before Ready 500 Global CDMX/Medellín (Sept 26, finished), Game Jam Plus 11th ed. (global).
- Still pending: Ripio wFIAT hackathon, São Paulo Oct 31 (Google Form only).

## First sweep results (2026-10-13)
Seeded (verified):
- Hackatón Open Payments Medellín, Oct 16–17, USD 20k. Post: https://x.com/Interledger/status/2108335667419705511. Official page: https://live.eventtia.com/es/build-the-future-of-finance
- Hackatón Cívico IECM (CDMX, ages 12–17), registration until Oct 30, in person Nov 11–17. Post: https://x.com/Distrito28IECM/status/2108619754152026467. Official page: https://aplicaciones2.iecm.mx/HackatonCivico/
- LABITCONF EDU HUB hackathon. Post: https://x.com/labitconf/status/2102909475271421996 (page: luma cwhw1uls)
- Superteam AR Colosseum track (closes Oct 13 03:59 ART). Post: https://x.com/SuperteamAR/status/2103494734798803216
- belo hackathon Oct 28. Post: https://x.com/lucasmcasp/status/2106585710564090363 (official link still pending)

Not seeded:
- Ripio wFIAT hackathon, São Paulo, Oct 31, USD 4,500 (https://x.com/RipioApp/status/2107211507813830840). The only link is a Google Form and there's no official page yet. Re-check.
- Celo × Ripio "Agents on Open Rails" (https://loops.house/agents-on-open-rails, via @ArtuGrande builder-session posts): global, USD 5k. Candidate, page not yet verified.
- Hackathon AutonomIA (CABA, Oct 16–17): registration closed Oct 5.
- Monad Metropolis (ended Oct 13), UP Marketing Hackathon (Softr/UP, pitch Oct 29; the luma page was for a past workshop), and PUMM 2026 (no official page checked).
