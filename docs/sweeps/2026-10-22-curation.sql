-- Verified official sources. Unknown hours and dates remain NULL.
-- Idempotent: never overwrite an existing listing with the same source URL or slug.
begin;
insert into public.listings (
 slug,source,external_id,type,title,title_lang,organizer,source_url,apply_url,verified_url,verified_at,source_post_url,
 starts_at,ends_at,deadline_at,modality,country,city,venue,region_tags,ecosystems,
 eligibility,eligibility_short,eligibility_note,reward_amount,reward_currency,reward_usd,reward_kind,reward_text,
 summary_es,curated,in_latam,organizer_description,organizer_source_url,organizer_website,raw
)
select
 'agents-on-open-rails-celo-2026','x','2110052831701114914','hackathon','Agents on Open Rails Hackathon','en','Celo Core Co. · Loops House',
 'https://www.loops.house/agents-on-open-rails','https://www.loops.house/agents-on-open-rails','https://www.loops.house/agents-on-open-rails',now(),'https://x.com/CeloDevs/status/2110052831701114914',
 '2026-10-06T12:00:00Z'::timestamptz,'2026-11-09T09:00:00Z'::timestamptz,'2026-11-09T09:00:00Z'::timestamptz,
 'online',null,null,null,array[]::text[],array['Celo','AI'],
 'global','Abierto · online','Participación remota, con un track orientado a Latinoamérica. Requiere Celo mainnet, repositorio público en GitHub, identidad ERC-8004 y código escrito durante la hackatón. La página no publica límites de edad ni una lista de países excluidos; revisá las reglas oficiales antes de participar.',
 5000,'USD',5000,'total_pool','USD 2.000 para Stable Agents: LatAm; USD 2.000 para Open Corridors; USD 1.000 entre cinco proyectos de Build with buy.',
 array['Construí agentes que cobren, paguen y operen con usuarios reales en Celo mainnet.','Inscripción y entrega hasta el 9 de noviembre de 2026 a las 09:00 UTC (06:00 de Argentina).','Tres tracks: Stable Agents: LatAm, Open Corridors y Build with buy.','Pozo total de USD 5.000; cada equipo puede ganar un premio por track.','Requiere repositorio público en GitHub e identidad ERC-8004; resultados anunciados el 13 de noviembre.'],
 true,true,'Celo Core Co. impulsa esta hackatón de agentes sobre Celo, con tracks de pagos y stablecoins junto a Ripio, Textile FX y buy.',
 'https://www.loops.house/agents-on-open-rails','https://www.loops.house/',
 jsonb_build_object('source_posts',jsonb_build_array('https://x.com/CeloDevs/status/2110052831701114914'),'verification','Schedule and online mode verified in official JSON-LD and heroMeta; registration_open. Eligibility checked in official FAQ; Argentina participation confirmed by CeloDevs.')
where not exists (select 1 from public.listings where slug='agents-on-open-rails-celo-2026' or verified_url in ('https://loops.house/agents-on-open-rails','https://www.loops.house/agents-on-open-rails') or source_url='https://www.loops.house/agents-on-open-rails');

insert into public.listings (
 slug,source,external_id,type,title,title_lang,organizer,source_url,apply_url,verified_url,verified_at,
 starts_at,ends_at,deadline_at,modality,country,city,venue,region_tags,ecosystems,
 eligibility,eligibility_short,eligibility_note,reward_text,
 summary_es,curated,in_latam,organizer_description,organizer_source_url,organizer_website,raw
)
select
 'wolfram-hackathon-virtual-brasil-2026','manual','wolfram-hackathon-virtual-brasil-2026','hackathon','Hackathon Virtual da Wolfram · Brasil 2026','pt','Wolfram Research',
 'https://www.wolfram.com/events/user-conference-brazil/2026/hackathon/',
 'https://www.wolfram.com/events/user-conference-brazil/2026/registration/',
 'https://www.wolfram.com/events/user-conference-brazil/2026/hackathon/',now(),
 '2026-11-09T17:30:00Z'::timestamptz,null,null,'online',null,null,null,array[]::text[],array['AI','Wolfram'],
 'restricted','Solo estudiantes · online','Para estudiantes de nivel primario, secundario, grado, maestría o doctorado; equipos de 3 a 5 personas. No pueden participar representantes de organizaciones comerciales o gubernamentales. Inscripción mediante el registro de la conferencia hasta el 6 de noviembre de 2026; la fuente no publica hora de cierre. Actividades por Zoom y Wolfram Community.',
 'Una suscripción anual a Wolfram|Alpha Pro y Wolfram System Modeler para cada integrante del equipo ganador.',
 array['Hackatón virtual gratuita para desarrollar un proyecto original en Wolfram Language.','Reunión inicial el 9 de noviembre de 2026 a las 14:30 GMT-3, por Zoom.','Solo estudiantes, en equipos de 3 a 5; inscripción con la conferencia hasta el 6 de noviembre (sin hora publicada).','Publicación de proyectos en Wolfram Community hasta el 16 de noviembre; resultados el 21 de noviembre.','La agenda contiene una línea inconsistente sobre el inicio de ejecución: revisá el cronograma oficial.'],
 true,true,'Wolfram Research desarrolla Wolfram Language, Mathematica, Wolfram|Alpha y herramientas para computación, ciencia de datos e investigación.',
 'https://www.wolfram.com/events/user-conference-brazil/2026/','https://www.wolfram.com/',
 jsonb_build_object('registration_deadline_date','2026-11-06','submission_deadline_date','2026-11-16','verification','No closing time inferred. Source has inconsistent weekday/date in project-execution row; only unambiguous kickoff time stored.')
where not exists (select 1 from public.listings where slug='wolfram-hackathon-virtual-brasil-2026' or verified_url='https://www.wolfram.com/events/user-conference-brazil/2026/hackathon/' or source_url='https://www.wolfram.com/events/user-conference-brazil/2026/hackathon/');
commit;
select id,slug,title from public.listings where slug in ('agents-on-open-rails-celo-2026','wolfram-hackathon-virtual-brasil-2026');
