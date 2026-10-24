# Bienvenida después de confirmar

`POST /api/newsletter/confirm` confirma mediante `cn_confirm_with_welcome` y envía la bienvenida por Resend. La confirmación y el registro privado `cn_newsletter_welcome` se crean en una misma transacción. El token de confirmación se consume una sola vez, por lo que reabrir el enlace no genera otro envío. No hay envío retroactivo a suscriptores existentes.

El mail usa `lib/welcome-email.ts`, con HTML oscuro, verde lima, texto plano, botón de oportunidades y firma de Condor Nest. Incluye enlace personal para darse de baja y cabeceras One-Click; los tokens de baja solo se guardan como hashes. La nueva bienvenida reemplaza el token de baja del mail de confirmación con el enlace incluido en la bienvenida.

El newsletter del 26/10 incluye una apertura editorial sobre la primera semana, con cifras verificadas al 24/10 (265 visitantes, 677 páginas vistas y visitantes de 24 países en los últimos siete días de Vercel; 6 suscripciones confirmadas). Es una foto de esa edición; los borradores de semanas posteriores usan una apertura cálida sin repetir esas cifras. Los destacados vigentes siguen primero dentro de la selección de oportunidades.

La entrega usa la clave `newsletter-welcome-<id>` y los dos intentos del helper de Resend. `sent` significa aceptado por Resend; la entrega final se verifica en su dashboard. Si falla, la suscripción sigue confirmada y queda el registro `failed`. No hay reintento programado adicional: revisar fallos antes de reenviar y no reintentar a ciegas después de las 24 horas de idempotencia de Resend.

Antes de desplegar, aplicar `supabase/migrations/20261022193000_newsletter_welcome.sql` y ejecutar `supabase/tests/newsletter_welcome.sql` (las pruebas se revierten y no envían mails).

El 22/10/2026 se verificó que Ulises estaba confirmado desde el 14/10 y se enviaron pruebas de la plantilla solo a su dirección autorizada. La plantilla de prueba en Resend desactiva el enlace de baja explícitamente para no modificar su suscripción durante la revisión. El envío automático sí lleva un enlace válido.

## Newsletter semanal: criterio editorial y envío

Ulises siempre agrega una nota personal sobre lo que hizo y cómo avanza Condor Nest. El borrador automático debe dejar espacio para esa nota y no enviarse sin su revisión. El cron prepara el material; Resend se usa para revisar la audiencia, editar y enviar el Broadcast, y consultar entregas y clics. No se deben inventar avances ni métricas: usar cifras verificadas, con fecha y fuente.

La identidad aprobada para el newsletter es tema oscuro, tipografías `Unbounded` y `Space Grotesk` con fuentes de respaldo, verde lima `#c6ff3d`, firma con banner `public/email/condor-nest-firma.png`, línea verde separando la nota personal de las oportunidades y etiquetas de tipo/cierre en verde y negrita. Omitir rótulos internos como «EDICIÓN DE PRUEBA» en los correos para suscriptores. Los destacados vigentes van primero y conservan `★ DESTACADO` durante su semana destacada. Los cerrados o vencidos se excluyen; se agregan hasta cinco oportunidades más elegibles con fechas próximas, enlaces y requisitos claros. Cada oportunidad enlaza a su ficha con UTMs.

El 24/10/2026 se envió el Broadcast `Condor Nest · 2026-10-26`, con asunto `Condor Nest · Nuestra primera semana juntos`, al segmento de producción `Condor Nest · Newsletter confirmados` (`c02cccf7-c438-43ab-bf71-4b8962704f58`). La lista contenía las seis suscripciones con estado `confirmed` en Supabase; Resend mostró las seis como **Delivered**. No se incluyeron las cuatro solicitudes que seguían pendientes. La edición compartió el primer avance del sitio (265 visitantes, 677 páginas vistas y visitantes de 24 países en Vercel entre el 17 y el 24/10; seis suscripciones confirmadas en Condor Nest), agradeció a las primeras seis personas y presentó tres oportunidades. Los clics de pruebas anteriores no pertenecen a este Broadcast; al revisar el envío, todavía no había clics registrados en la campaña.

El segmento de prueba en Resend sigue siendo `Condor Nest · Newsletter prueba` (`e1d0abe6-6148-4b90-9a02-2be2a7764fe8`) y contiene los dos contactos de prueba. El segmento de producción se creó manualmente con los seis suscriptores confirmados y cero bajas al momento del envío. No copiar contactos pendientes, dados de baja o de prueba al segmento de producción. Antes de cada edición, comparar el estado confirmado de Supabase con la audiencia de Resend.

El seguimiento de clics de Resend está activado para el dominio mediante `links.condor-nest.lat`; el seguimiento de aperturas está desactivado. Resend reescribe enlaces con ese subdominio y la prueba confirmó que los enlaces de publicaciones redirigen a su ficha. Después de un envío real se pueden consultar clics y clics únicos por URL para encontrar la oportunidad más elegida. La prueba anterior registró un clic nuestro en Hackatón Cívico 2026 · CDMX; no contarlo como interacción de suscriptor. Los clics de «Inscribirme» en la web se cuentan aparte y hoy no quedan unidos de forma fiable a una edición del newsletter.

## Preparación automática: estado y requisitos

El cron `GET /api/cron/newsletter-draft` está en el PR [#5](https://github.com/ulises-ASTRADA/condor-nest/pull/5), todavía marcado como borrador y no desplegado en producción. Está programado para los domingos a las 12:00 UTC en `vercel.json`; cuando se despliegue, seleccionará las oportunidades y preparará un borrador para el lunes siguiente. Nunca envía el Broadcast automáticamente. El tiempo de cron de Vercel Hobby puede variar hasta una hora.

Al 24/10/2026, la producción de Vercel tiene `CRON_SECRET`, `RESEND_FROM` y `RESEND_API_KEY`, pero no `RESEND_BROADCAST_API_KEY`. La clave `RESEND_API_KEY` se limita a los envíos transaccionales `/emails`; el cron necesita una clave de Resend con acceso a Broadcasts. El código del PR todavía apunta al segmento de prueba y no sincroniza los contactos confirmados ni sus bajas desde Supabase. Para dejar el proceso semanal listo hay que revisar y fusionar el PR, provisionar la clave de Broadcasts en Vercel, cambiar la ruta a la audiencia de producción e implementar una sincronización que conserve las bajas. Mantener siempre la revisión y la nota personal de Ulises antes del envío.

La ruta usa `CRON_SECRET`, revisa si ya existe un Broadcast con el mismo nombre y segmento y requiere `RESEND_FROM` de un dominio verificado. Si hay menos de tres oportunidades válidas, no crea un borrador vacío. La precisión del cron en Vercel Hobby es de una hora, suficiente para preparar el borrador dominical.

Los reenvíos puntuales autorizados a suscriptores ya confirmados se preparan con un registro privado que contiene un `dispatch_token_hash` aleatorio y vencimiento corto. El mismo endpoint consume ese token una sola vez, verifica que el contacto siga confirmado y conserva `confirmed_at`. Este mecanismo no selecciona ni envía automáticamente a toda la base. El enlace de baja nuevo reemplaza el anterior.
