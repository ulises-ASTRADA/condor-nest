-- Fuente: anuncio de Arturo Grande para CeloDevs del 23/10/2026.
-- La fecha indicada es el cierre de entregas de la hackatón vinculada;
-- el anuncio no publica un formulario ni bases completas para líderes.
-- Ejecutar solo después de un respaldo verificado de la base de producción.
begin;

insert into public.listings (
  slug, source, external_id, type, title, title_lang, organizer,
  source_url, apply_url, verified_url, verified_at, source_post_url,
  deadline_at, modality, country, region_tags, ecosystems,
  eligibility, eligibility_short, eligibility_note,
  reward_amount, reward_currency, reward_usd, reward_kind, reward_text,
  summary_es, curated, in_latam, organizer_description,
  organizer_source_url, raw
)
select
  'celo-community-leader-agents-on-open-rails-2026', 'x',
  '2113649209228312751-community-leader', 'bounty',
  'Bounty CeloDevs para líderes de comunidad · Agents on Open Rails',
  'es', 'CeloDevs',
  'https://x.com/ArtuGrande/status/2113649209228312751',
  'https://www.loops.house/agents-on-open-rails',
  'https://x.com/ArtuGrande/status/2113649209228312751', now(),
  'https://x.com/ArtuGrande/status/2113649209228312751',
  '2026-11-09T09:00:00Z'::timestamptz,
  'online', 'AR', array['Argentina']::text[], array['Celo','AI']::text[],
  'ar', 'Líderes de comunidad · AR',
  'Para líderes comunitarios de ciudades argentinas. Según el anuncio, recibe USD 200 el líder de la ciudad con más entregas ganadoras en Agents on Open Rails. No se publicó una postulación específica para este bono ni las bases completas de adjudicación. El enlace de inscripción corresponde a la hackatón, no a una postulación separada para líderes.',
  200, 'USD', 200, null,
  'Para el líder comunitario de la ciudad argentina con más entregas ganadoras; separado del pozo de USD 5.000 para proyectos.',
  array[
    'CeloDevs anunció un bono especial para el líder comunitario de la ciudad argentina que logre más entregas ganadoras en la hackatón Agents on Open Rails.',
    'El enlace de inscripción lleva a la hackatón vinculada. El anuncio no incluye un formulario separado ni las bases completas para reclamar este bono.',
    'Las entregas de la hackatón cierran el 9 de noviembre de 2026 a las 09:00 UTC (06:00 de Argentina). Esta es la fecha del evento vinculado, no un plazo propio publicado para la bounty.',
    'El bono de USD 200 es independiente del pozo de USD 5.000 destinado a los proyectos participantes.'
  ],
  true, true,
  'CeloDevs impulsa comunidades de desarrolladores que construyen en Celo.',
  'https://x.com/CeloDevs',
  jsonb_build_object(
    'related_listing_slug', 'agents-on-open-rails-celo-2026',
    'community_bounty', true,
    'bounty_rules_published', false,
    'separate_application_published', false,
    'deadline_basis', 'hackathon submission deadline, not a separately announced bounty deadline',
    'leaderboard_url', 'https://openrails.celobuilders.xyz/'
  )
where not exists (
  select 1 from public.listings
  where slug = 'celo-community-leader-agents-on-open-rails-2026'
     or (source = 'x' and external_id = '2113649209228312751-community-leader')
);

commit;
