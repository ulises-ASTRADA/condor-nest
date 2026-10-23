-- Sources checked on 2026-10-23, including each registration page.
-- Run only after a fresh, verified database backup.
begin;

insert into public.listings (
  slug, source, external_id, type, title, title_lang, organizer,
  source_url, apply_url, verified_url, verified_at, source_post_url,
  starts_at, ends_at, deadline_at, modality, country, city, venue,
  region_tags, ecosystems, eligibility, eligibility_short, eligibility_note,
  reward_amount, reward_currency, reward_usd, reward_kind, reward_text,
  summary_es, curated, in_latam, organizer_description,
  organizer_source_url, organizer_website, raw
)
select
  'ripio-local-stablecoins-hackathon-2026', 'manual', 'ripio-local-stablecoins-hackathon-2026',
  'hackathon', 'Ripio Local Stablecoins Hackathon', 'pt', 'Ripio',
  'https://pt.linkedin.com/posts/ripio_local-stablecoins-hackathon-activity-7512954803208187905-uXqt',
  'https://docs.google.com/forms/d/e/1FAIpQLScLy6fND83ktX1EcN7FD-s713-xdFzqEuNedVF4bxDdcJGNjQ/viewform',
  'https://pt.linkedin.com/posts/ripio_local-stablecoins-hackathon-activity-7512954803208187905-uXqt',
  now(),
  'https://pt.linkedin.com/posts/ripio_local-stablecoins-hackathon-activity-7512954803208187905-uXqt',
  '2026-10-31T11:00:00Z'::timestamptz, '2026-10-31T22:30:00Z'::timestamptz,
  null, 'irl', 'BR', 'São Paulo', null,
  array['Brasil']::text[], array['Ripio','wFIAT','Web3']::text[],
  'global', 'Presencial · São Paulo',
  'Hackatón presencial con 60 cupos sujetos a curaduría. El formulario contempla equipos de 3 a 5 personas y la posibilidad de solicitar asignación a un equipo. No exige experiencia previa en blockchain. Completarlo no garantiza una plaza; los seleccionados reciben confirmación por email. La sede exacta aún no fue publicada.',
  4500, 'USD', 4500, 'total_pool',
  'USD 2.500 para el primer puesto, USD 1.500 para el segundo y USD 500 para el tercero; los equipos ganadores podrían desarrollar un piloto con Ripio.',
  array[
    'Construí aplicaciones sobre wFIAT, las stablecoins locales de Ripio, el 31 de octubre de 2026 en São Paulo.',
    'Tracks: pagos transfronterizos y tesorería, payroll, servicios financieros, agentes de IA, gaming, retail y nuevas experiencias.',
    '60 cupos con selección; el formulario permite postularse sin equipo para ser asignado a uno.',
    'La ubicación precisa está por confirmar. No se publicó una fecha límite de inscripción.'
  ],
  true, true,
  'Ripio desarrolla productos de infraestructura financiera y activos digitales para Latinoamérica.',
  'https://pt.linkedin.com/company/ripio/', 'https://www.ripio.com/',
  jsonb_build_object('registration_verified', true, 'registration_capacity', 60,
    'registration_form', 'https://docs.google.com/forms/d/e/1FAIpQLScLy6fND83ktX1EcN7FD-s713-xdFzqEuNedVF4bxDdcJGNjQ/viewform',
    'verification_note', 'El post dice equipos de 1 a 5; el formulario dice equipos de 3 a 5 y permite pedir asignación. Se usa el criterio del formulario para la ficha.')
where not exists (
  select 1 from public.listings where slug = 'ripio-local-stablecoins-hackathon-2026'
  or apply_url = 'https://docs.google.com/forms/d/e/1FAIpQLScLy6fND83ktX1EcN7FD-s713-xdFzqEuNedVF4bxDdcJGNjQ/viewform'
);

insert into public.listings (
  slug, source, external_id, type, title, title_lang, organizer,
  source_url, apply_url, verified_url, verified_at, source_post_url,
  starts_at, ends_at, deadline_at, modality, country, city, venue,
  region_tags, ecosystems, eligibility, eligibility_short, eligibility_note,
  reward_text, summary_es, curated, in_latam, organizer_description,
  organizer_source_url, organizer_website, raw
)
select
  'argentina-space-hackathon-2026', 'x', '2097351908843196507',
  'hackathon', 'Argentina Space 2026 · Hackathon', 'es', 'Argentina Space · SaltaDev',
  'https://www.argentinaspace.com/es/hackathon', 'https://luma.com/ivdtiv4q',
  'https://www.argentinaspace.com/es/hackathon', now(),
  'https://x.com/ArtuGrande/status/2097351908843196507',
  null, null,
  null, 'irl', 'AR', 'Salta', 'Centro de Convenciones de Salta',
  array['Argentina']::text[], array['Space','Robótica','Innovación']::text[],
  'global', 'Presencial · Salta',
  'Convoca a desarrolladores, diseñadores, estudiantes y perfiles de negocio. Podés anotarte individualmente, con equipo o formar uno durante el evento. Elegís entre Hackathon y Desafío Rover en el registro. La página del hackathon indica 11 y 12/11; Luma muestra la competencia completa del 11 al 13/11. El costo de participación en el hackathon no está confirmado en la página oficial. Los horarios específicos del hackathon no están publicados.',
  'Habrá reconocimientos para los mejores proyectos; el monto y el detalle todavía no fueron publicados.',
  array[
    'Desafíos de minería, agronomía y New Space; el Desafío Rover corre en paralelo.',
    'Hackathon el 11 y 12 de noviembre de 2026 según la página oficial; los horarios específicos todavía no están publicados.',
    'El formulario Luma abarca toda la competencia del 11 al 13 de noviembre. Confirmá el cronograma de tu track antes de viajar.',
    'Podés inscribirte individualmente, con equipo o formar uno allí.',
    'Los premios monetarios y el costo específico del hackathon siguen sin confirmar.'
  ],
  true, true,
  'Argentina Space organiza el encuentro de industria espacial y tecnológica en Salta; la competencia se realiza junto con SaltaDev.',
  'https://www.argentinaspace.com/es/hackathon', 'https://www.argentinaspace.com/',
  jsonb_build_object('registration_verified', true,
    'event_start_date', '2026-11-11', 'event_end_date', '2026-11-12',
    'date_conflict', 'Página oficial: hackathon 11–12/11. Luma: competencia completa 11–13/11, 08:30 a 19:00 GMT-3. Los timestamps del hackathon se dejan nulos porque sus horas no fueron publicadas.',
    'registration_form', 'https://luma.com/ivdtiv4q')
where not exists (
  select 1 from public.listings where slug = 'argentina-space-hackathon-2026'
  or apply_url = 'https://luma.com/ivdtiv4q'
);

insert into public.listings (
  slug, source, external_id, type, title, title_lang, organizer,
  source_url, apply_url, verified_url, verified_at,
  starts_at, ends_at, deadline_at, modality, country, city, venue,
  region_tags, ecosystems, eligibility, eligibility_short, eligibility_note,
  reward_text, summary_es, curated, in_latam, organizer_description,
  organizer_source_url, organizer_website, raw
)
select
  'hack-to-the-future-cordoba-2026', 'manual', 'hack-to-the-future-cordoba-2026',
  'hackathon', 'Hack to the Future · Córdoba Tech Week 2026', 'es', 'Córdoba Cluster',
  'https://cordobatechweek.com/side-events/hack-to-the-future/',
  'https://docs.google.com/forms/d/e/1FAIpQLSexGw_tEwodW-GpGT_dLX_GtUMym3xFheDz5Q6vh4BrJnzN8g/viewform',
  'https://cordobatechweek.com/side-events/hack-to-the-future/', now(),
  '2026-11-12T12:00:00Z'::timestamptz, '2026-11-13T19:00:00Z'::timestamptz,
  null, 'irl', 'AR', 'Córdoba', 'Pabellón Amarillo, Predio Ferial Córdoba',
  array['Argentina']::text[], array['Sostenibilidad','IA']::text[],
  'restricted', '18–35 · presencial Cba',
  'Para personas de 18 a 35 años de cualquier disciplina, sin conocimientos previos obligatorios. Se puede postular individualmente o en equipo. Inscripción hasta el 31 de octubre de 2026; el formulario es una postulación, no una confirmación automática de plaza.',
  'Cuatro equipos ganadores obtendrán acceso a un programa de incubación de la Unión Europea en 2027; no se publica un premio en dinero.',
  array[
    'Hackatón de sostenibilidad dentro de Córdoba Tech Week: biodiversidad, agro, movilidad y residuos.',
    '12 y 13 de noviembre, de 9 a 16 h, en el Pabellón Amarillo del Predio Ferial Córdoba.',
    'Postulaciones hasta el 31/10. No necesitás experiencia previa ni equipo armado.',
    'Los cuatro equipos ganadores acceden a un programa de incubación de la Unión Europea en 2027.'
  ],
  true, true,
  'Córdoba Cluster reúne al ecosistema tecnológico provincial y organiza este hackathon de innovación sostenible en el marco de Córdoba Tech Week.',
  'https://cordobatechweek.com/side-events/hack-to-the-future/', 'https://cordobacluster.com/',
  jsonb_build_object('registration_verified', true,
    'registration_deadline_date', '2026-10-31',
    'registration_form', 'https://docs.google.com/forms/d/e/1FAIpQLSexGw_tEwodW-GpGT_dLX_GtUMym3xFheDz5Q6vh4BrJnzN8g/viewform',
    'event_context', 'Córdoba Tech Week 2026',
    'verification_note', 'La página oficial publica 9–16 h; el formulario tiene texto horario truncado y confirma fechas, sede y cierre de postulación.')
where not exists (
  select 1 from public.listings where slug = 'hack-to-the-future-cordoba-2026'
  or apply_url = 'https://docs.google.com/forms/d/e/1FAIpQLSexGw_tEwodW-GpGT_dLX_GtUMym3xFheDz5Q6vh4BrJnzN8g/viewform'
);

insert into public.listings (
  slug, source, external_id, type, title, title_lang, organizer,
  source_url, apply_url, verified_url, verified_at,
  starts_at, ends_at, deadline_at, modality, country, city, venue,
  region_tags, ecosystems, eligibility, eligibility_short, eligibility_note,
  summary_es, curated, in_latam, organizer_description,
  organizer_source_url, organizer_website, raw
)
select
  'qiskit-fall-fest-tec-monterrey-2026', 'manual', 'qiskit-fall-fest-tec-monterrey-2026',
  'hackathon', 'Qiskit Fall Fest 2026 · Tec de Monterrey', 'en',
  'Smart Electronics · Tecnológico de Monterrey',
  'https://quantum-se-tec.github.io/qff-2026-tec-de-monterrey-smart-electronics/',
  'https://docs.google.com/forms/d/e/1FAIpQLSdg09xuTYDoUxqU3QOj9i1DHCD24xkYX3OIf-ozRm6IwnGJCA/viewform',
  'https://quantum-se-tec.github.io/qff-2026-tec-de-monterrey-smart-electronics/', now(),
  '2026-11-03T17:00:00Z'::timestamptz, '2026-11-08T00:30:00Z'::timestamptz,
  null, 'irl', 'MX', 'Monterrey', 'Tecnológico de Monterrey, Campus Monterrey',
  array['México']::text[], array['Qiskit','IBM Quantum']::text[],
  'restricted', 'Solo estudiantes Tec',
  'El formulario exige ser estudiante vigente del Tecnológico de Monterrey, correo institucional y matrícula. Participación presencial, gratuita y limitada a 50 personas. Los talleres van del 3 al 5 de noviembre; la hackatón comienza el 6 y se presenta el 7.',
  array[
    'Programa presencial gratuito de computación cuántica con talleres de Qiskit y una hackatón por equipos.',
    'Del 3 al 7 de noviembre en Campus Monterrey; la hackatón comienza el 6 y la muestra final es el 7.',
    'Solo para estudiantes vigentes del Tec de Monterrey; requiere correo institucional y matrícula. 50 cupos.',
    'La página anuncia ganadores, pero no publica premios ni montos.'
  ],
  true, true,
  'Smart Electronics y organizaciones estudiantiles del Tecnológico de Monterrey coordinan este programa junto al ecosistema IBM Quantum.',
  'https://quantum-se-tec.github.io/qff-2026-tec-de-monterrey-smart-electronics/',
  'https://quantum-se-tec.github.io/qff-2026-tec-de-monterrey-smart-electronics/',
  jsonb_build_object('registration_verified', true, 'registration_capacity', 50,
    'registration_form', 'https://docs.google.com/forms/d/e/1FAIpQLSdg09xuTYDoUxqU3QOj9i1DHCD24xkYX3OIf-ozRm6IwnGJCA/viewform',
    'verification_note', 'El formulario exige declaración de matrícula vigente del Tec, ID de estudiante, correo institucional y asistencia presencial.')
where not exists (
  select 1 from public.listings where slug = 'qiskit-fall-fest-tec-monterrey-2026'
  or apply_url = 'https://docs.google.com/forms/d/e/1FAIpQLSdg09xuTYDoUxqU3QOj9i1DHCD24xkYX3OIf-ozRm6IwnGJCA/viewform'
);

commit;

select slug, title, apply_url from public.listings
where slug in (
  'ripio-local-stablecoins-hackathon-2026',
  'argentina-space-hackathon-2026',
  'hack-to-the-future-cordoba-2026',
  'qiskit-fall-fest-tec-monterrey-2026'
)
order by slug;
