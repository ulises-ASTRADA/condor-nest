-- Fuentes verificadas el 23/10/2026:
-- https://www.labitconf.com/mas/hackathon
-- https://luma.com/cwhw1uls
-- https://docs.google.com/document/d/1h6GlcaLcnSlQdjanoidrk7rA0T6Q1Jwe1ttdXHUoUvk/edit
-- La sección de inscripción de las bases dice 16/10, pero la tabla de fechas
-- dice 25/10; Luma sigue mostrando "Request to Join". No fijar una hora inventada.
-- Ejecutar solo después de un respaldo verificado de la DB.
begin;

update public.listings set
  source_url = 'https://www.labitconf.com/mas/hackathon',
  verified_url = 'https://www.labitconf.com/mas/hackathon',
  verified_at = now(),
  organizer = 'EDU HUB · LABITCONF',
  organizer_description = 'EDU HUB es el espacio de LABITCONF para estudiantes, docentes, alumni y universidades que participan en la conferencia.',
  organizer_source_url = 'https://www.labitconf.com/mas/edu-hub',
  organizer_website = 'https://www.labitconf.com/mas/edu-hub',
  eligibility_note = 'Reservada a miembros EDU HUB: estudiantes, docentes y alumni de universidades acreditadas a LABITCONF 2026. Equipos de 4 a 5 personas; cada integrante debe solicitar ingreso por Luma y la inscripción requiere aprobación. Si la universidad no está acreditada, la organización indica escribir a contacto@labitconf.com.',
  eligibility_short = 'Solo miembros EDU HUB',
  reward_text = 'USD 1.000 y una semana de aceleración con Picante para el primer puesto; USD 500 para el segundo. También hay becas Humai para los tres primeros puestos.',
  summary_es = array[
    'Hackatón presencial del 30 al 31 de octubre en Costa Salguero, Buenos Aires; se construye una demo funcional y se presenta ante jurado.',
    'Solo para miembros EDU HUB de universidades acreditadas: estudiantes, docentes y alumni. Equipos de 4 a 5; inscripción individual en Luma con aprobación del anfitrión.',
    'Cuatro tracks: Inclusión Financiera, Nueva Educación, Creator Economy e Impacto y Comunidad.',
    'USD 1.500 en premios monetarios: USD 1.000 al primer puesto y USD 500 al segundo; también se anuncian becas Humai y aceleración con Picante.',
    'Las bases tienen fechas de cierre contradictorias (16 y 25 de octubre). Al 23/10, Luma muestra solicitud de ingreso. Confirmá la disponibilidad con la organización antes de planificar tu participación.'
  ],
  raw = coalesce(raw, '{}'::jsonb) || jsonb_build_object(
    'rules_url', 'https://docs.google.com/document/d/1h6GlcaLcnSlQdjanoidrk7rA0T6Q1Jwe1ttdXHUoUvk/edit',
    'registration_status_checked_at', '2026-10-23',
    'registration_status', 'Luma Request to Join; approval required',
    'deadline_conflict', 'Rules body says 2026-10-16; key dates table says 2026-10-25. No time specified.'
  ),
  updated_at = now()
where slug = 'labitconf-hackathon-edu-2026'
returning slug, eligibility_short, reward_amount, deadline_at, updated_at;

commit;
