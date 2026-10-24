# Bienvenida después de confirmar

`POST /api/newsletter/confirm` confirma mediante `cn_confirm_with_welcome` y envía la bienvenida por Resend. La confirmación y el registro privado `cn_newsletter_welcome` se crean en una misma transacción. El token de confirmación se consume una sola vez, por lo que reabrir el enlace no genera otro envío. No hay envío retroactivo a suscriptores existentes.

El mail usa `lib/welcome-email.ts`, con HTML oscuro, verde lima, texto plano, botón de oportunidades y firma de Condor Nest. Incluye enlace personal para darse de baja y cabeceras One-Click; los tokens de baja solo se guardan como hashes. La nueva bienvenida reemplaza el token de baja del mail de confirmación con el enlace incluido en la bienvenida.

El newsletter del 26/10 incluye una apertura editorial sobre la primera semana, con cifras verificadas al 24/10 (265 visitantes, 677 páginas vistas y visitantes de 24 países en los últimos siete días de Vercel; 6 suscripciones confirmadas). Es una foto de esa edición; los borradores de semanas posteriores usan una apertura cálida sin repetir esas cifras. Los destacados vigentes siguen primero dentro de la selección de oportunidades.

La entrega usa la clave `newsletter-welcome-<id>` y los dos intentos del helper de Resend. `sent` significa aceptado por Resend; la entrega final se verifica en su dashboard. Si falla, la suscripción sigue confirmada y queda el registro `failed`. No hay reintento programado adicional: revisar fallos antes de reenviar y no reintentar a ciegas después de las 24 horas de idempotencia de Resend.

Antes de desplegar, aplicar `supabase/migrations/20261022193000_newsletter_welcome.sql` y ejecutar `supabase/tests/newsletter_welcome.sql` (las pruebas se revierten y no envían mails).

El 22/10/2026 se verificó que Ulises estaba confirmado desde el 14/10 y se enviaron pruebas de la plantilla solo a su dirección autorizada. La plantilla de prueba en Resend desactiva el enlace de baja explícitamente para no modificar su suscripción durante la revisión. El envío automático sí lleva un enlace válido.

## Newsletter semanal: prueba controlada

La audiencia de prueba en Resend es el segmento `e1d0abe6-6148-4b90-9a02-2be2a7764fe8`, con dos contactos autorizados por Ulises. La edición inicial está en [Broadcasts](https://resend.com/broadcasts/cf35b1a0-beab-465f-8830-c4c66bb0f246/editor) como borrador. El 24/10/2026 se envió un **test email**, no el Broadcast, a las dos direcciones; Resend marcó ambas entregadas.

El cron `GET /api/cron/newsletter-draft` corre los domingos a las 12:00 UTC y crea un borrador para el lunes siguiente. Los destacados activos y abiertos del sitio aparecen primero, con marca visual `★ DESTACADO`, durante las ediciones semanales que caigan dentro de su período de destacado. Los cerrados o vencidos se excluyen. Luego incluye hasta cinco convocatorias más con fecha de cierre conocida dentro de las próximas tres semanas, enlace de aplicación, elegibilidad conocida y acceso desde Argentina/LatAm. Incluye links a las fichas con UTM y la baja propia de Resend. Si hay menos de tres, no crea una edición vacía. La ruta usa `CRON_SECRET`, revisa si ya existe un Broadcast con el mismo nombre y segmento, y nunca lo envía. La precisión del cron en Vercel Hobby es de una hora; eso es suficiente para preparar un borrador el domingo.

Todas las plantillas generadas por la aplicación comparten la paleta oscura, tipografías `Unbounded` y `Space Grotesk` con fuentes de respaldo, y la firma con banner `public/email/condor-nest-firma.png`. Algunos clientes de correo ignoran tipografías web; el banner conserva la marca exacta. La plantilla puntual de Ian en Resend ya contiene esta firma.

Para activarlo se necesita `RESEND_BROADCAST_API_KEY` con acceso a Broadcasts en Production. La clave actual `RESEND_API_KEY` está limitada al envío de `/emails` y se conserva para confirmaciones y bienvenidas. La ruta no admite cambiar el segmento: solo apunta a las dos direcciones de prueba. `RESEND_FROM` debe ser un remitente del dominio verificado. Revisar contenido, enlaces y destinatarios en Resend antes de enviar o programar cada edición. La sincronización de los suscriptores confirmados de Supabase y sus bajas con Resend queda pendiente antes de ampliar la audiencia; agregar solo a quienes tengan consentimiento confirmado.

Los reenvíos puntuales autorizados a suscriptores ya confirmados se preparan con un registro privado que contiene un `dispatch_token_hash` aleatorio y vencimiento corto. El mismo endpoint consume ese token una sola vez, verifica que el contacto siga confirmado y conserva `confirmed_at`. Este mecanismo no selecciona ni envía automáticamente a toda la base. El enlace de baja nuevo reemplaza el anterior.
