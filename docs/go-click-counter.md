# Contador de clics de "Inscribirme" (/go/<slug>)

- El botón "Inscribirme" de cada ficha apunta a `/go/<slug>`. La ruta busca la ficha en la base (filtro público `in_latam`) y responde **302 solo a su `apply_url` guardada**. No acepta URLs por parámetro.
- El link "Link oficial: <dominio> ↗" del recuadro "En pocas palabras" también pasa por `/go/<slug>` (`rel="nofollow noopener"`, `sponsored nofollow noopener` en Destacados; mismo texto visible), **siempre que** el dominio que muestra sea el mismo de `apply_url`. Si el link oficial que se muestra es de otro dominio (`verified_url` en otro host), queda directo, porque `/go/` siempre lleva a `apply_url` y el texto no coincidiría con el destino. El JSON-LD sigue usando el link oficial, nunca `/go/`.
- Slug con formato inválido (fuera de `[A-Za-z0-9_-]{1,200}`, por ejemplo con `../` o `%2F`) → **400**.
- Slug desconocido o ficha sin `apply_url` → **302 dentro del mismo sitio**: a `/o/<slug>` si esa ficha existe, si no a `/` (el feed). `Location` es relativa, así que nunca sale del sitio, y **no se cuenta ningún clic**. Lleva los mismos headers (noindex, no-store, no-referrer).
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
`cn_clicks(id, listing_id, listing_slug, clicked_at, referrer_domain, referrer_path)`. `referrer_domain` es solo el hostname (sin `www.`, sin path ni query).
`referrer_path` es la ruta de la página de condor-nest donde se hizo el clic (`/o/hackatwin-2026`, `/hackathons-argentina`, `/`): solo se guarda si el Referer es `condor-nest.lat`, `www.condor-nest.lat` o el mismo host de la request (previews), solo el pathname (sin query ni `#`), hasta 200 caracteres y con caracteres `^/[A-Za-z0-9/_.-]*$`; si no, queda `NULL`. Se valida en la app y de nuevo en la base (función + CHECK). Sin IP, sin UA, sin cookies. RLS activado sin políticas: solo `service_role` lee y escribe; el insert va por `cn_record_click(uuid, text, text)` (SECURITY DEFINER, execute solo para `service_role`).

Migraciones: `20261020063000_cn_clicks.sql` (tabla y función) y `20261020070000_cn_clicks_path.sql` (`referrer_path`, función con 3 parámetros; la de 2 se borró).

## Consultas para Pulse (con service role / SQL editor)
Clics por página de origen en los últimos 7 días (ficha vs hubs vs home):
```sql
select coalesce(referrer_path, '(sin ruta / externo)') as pagina,
       case when referrer_path like '/o/%' then 'ficha'
            when referrer_path = '/' then 'home'
            when referrer_path is null then 'externo o sin referrer'
            else 'hub u otra' end as tipo,
       count(*) as clics,
       count(distinct listing_id) as fichas
from public.cn_clicks
where clicked_at >= now() - interval '7 days'
group by 1, 2
order by clics desc;
```
Por ficha y página de origen:
```sql
select listing_slug, referrer_path, count(*) as clics
from public.cn_clicks
where clicked_at >= now() - interval '7 days'
group by 1, 2
order by 3 desc;
```
