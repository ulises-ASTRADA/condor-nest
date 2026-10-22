# Bienvenida después de confirmar

`POST /api/newsletter/confirm` confirma mediante `cn_confirm_with_welcome` y envía la bienvenida por Resend. La confirmación y el registro privado `cn_newsletter_welcome` se crean en una misma transacción. El token de confirmación se consume una sola vez, por lo que reabrir el enlace no genera otro envío. No hay envío retroactivo a suscriptores existentes.

El mail usa `lib/welcome-email.ts`, con HTML oscuro, verde lima, texto plano, botón de oportunidades y firma de Condor Nest. Incluye enlace personal para darse de baja y cabeceras One-Click; los tokens de baja solo se guardan como hashes. La nueva bienvenida reemplaza el token de baja del mail de confirmación con el enlace incluido en la bienvenida.

La entrega usa la clave `newsletter-welcome-<id>` y los dos intentos del helper de Resend. `sent` significa aceptado por Resend; la entrega final se verifica en su dashboard. Si falla, la suscripción sigue confirmada y queda el registro `failed`. No hay reintento programado adicional: revisar fallos antes de reenviar y no reintentar a ciegas después de las 24 horas de idempotencia de Resend.

Antes de desplegar, aplicar `supabase/migrations/20261022193000_newsletter_welcome.sql` y ejecutar `supabase/tests/newsletter_welcome.sql` (las pruebas se revierten y no envían mails).

El 22/10/2026 se verificó que Ulises estaba confirmado desde el 14/10 y se enviaron pruebas de la plantilla solo a su dirección autorizada. La plantilla de prueba en Resend desactiva el enlace de baja explícitamente para no modificar su suscripción durante la revisión. El envío automático sí lleva un enlace válido.

Este cambio no implementa el newsletter semanal. La promesa de lunes que ya existe en la web corresponde a un flujo separado aún pendiente.

Los reenvíos puntuales autorizados a suscriptores ya confirmados se preparan con un registro privado que contiene un `dispatch_token_hash` aleatorio y vencimiento corto. El mismo endpoint consume ese token una sola vez, verifica que el contacto siga confirmado y conserva `confirmed_at`. Este mecanismo no selecciona ni envía automáticamente a toda la base. El enlace de baja nuevo reemplaza el anterior.
