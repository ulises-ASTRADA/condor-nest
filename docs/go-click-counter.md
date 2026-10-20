# Contador de clics de "Inscribirme" (/go/<slug>)

- El botón "Inscribirme" de cada ficha apunta a `/go/<slug>`. La ruta busca la ficha en la base (filtro público `in_latam`) y responde **302 solo a su `apply_url` guardada**. No acepta URLs por parámetro. Slug desconocido o sin link → 404.
- `/go/` queda fuera del índice: `Disallow: /go/` en robots.txt, `X-Robots-Tag: noindex, nofollow`, `rel="nofollow"` en el botón (con `sponsored` en Destacados), no está en el sitemap y el JSON-LD sigue usando el link oficial.
- La respuesta lleva `Referrer-Policy: no-referrer` (el sitio externo no recibe referrer, igual que con el `rel="noreferrer"` anterior) y `Cache-Control: private, no-store`.

## Qué cuenta como un clic
Se guarda una fila en `public.cn_clicks` solo si:
1. es `GET` (los `HEAD` redirigen pero no cuentan);
2. no es prefetch/prerender (`Purpose`, `Sec-Purpose`, `X-Purpose`, `X-Moz`, `Next-Router-Prefetch`);
3. el User-Agent existe y no parece bot, crawler, preview de redes o herramienta (curl, python, etc.). El UA se mira en memoria y **nunca se guarda**;
4. ese navegador no contó la misma ficha en los últimos 30 minutos. Se marca con una cookie propia `cng_<id de la ficha>=1` (HttpOnly, Secure, SameSite=Lax, Path=/go/, 30 min), sin ningún identificador.

Si el insert falla, la redirección igual funciona (se hace después de responder, con `after()`).

## Qué se guarda
`cn_clicks(id, listing_id, listing_slug, clicked_at, referrer_domain)`. `referrer_domain` es solo el hostname (sin `www.`, sin path ni query). Sin IP, sin UA, sin cookies. RLS activado sin políticas: solo `service_role` lee y escribe; el insert va por `cn_record_click(uuid, text)` (SECURITY DEFINER, execute solo para `service_role`).
