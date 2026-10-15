# Dominio `condor-nest.lat` + Resend

## Estado Vercel (2026-10-15)

- Comprado en Vercel (NS: `ns1/ns2.vercel-dns.com`), verificado, zona DNS activa.
- Proyecto `condor-nest`: `condor-nest.lat`, `www.condor-nest.lat`, `condor-nest.vercel.app`.
- `condor-nest.vercel.app` → redirige a `condor-nest.lat` (alias + `next.config.ts`).
- **Pendiente en el dashboard:** Vercel dejó el apex redirigiendo a `www` (308). Hay que invertirlo:

1. Abrí [Vercel → condor-nest → Settings → Domains](https://vercel.com/ulisesastrada1-9233s-projects/condor-nest/settings/domains).
2. En `condor-nest.lat`, sacá el redirect a `www` (quedá como dominio primario, sin redirect).
3. En `www.condor-nest.lat`, poné redirect → `condor-nest.lat` (301 o 308).
4. Confirmá que `condor-nest.vercel.app` sigue redirigiendo a `condor-nest.lat`.

Hasta que hagas eso, `https://condor-nest.lat` hace 308 a `https://www.condor-nest.lat/` (mismo deploy). El sitio responde 200 en www con HTTPS.

## Resend (newsletter a cualquier mail)

**No** cambies `RESEND_FROM` en Vercel hasta que el dominio figure como *Verified* en Resend. Si lo apuntás antes, los envíos fallan.

1. Entrá a [resend.com/domains](https://resend.com/domains) → **Add Domain** → `condor-nest.lat` (región la que uses hoy).
2. Copiá **exactamente** los registros de la pestaña Records (DKIM + SPF). Suelen ser:
   - TXT en un host tipo `resend._domainkey` (DKIM)
   - TXT y/o MX (o CNAME post-ago-2026) en el subdominio `send` — **no** en el apex si ya tenés mail en otro lado
3. Pegámelos acá o agregalos vos en Vercel → Domains → `condor-nest.lat` → DNS (Add Record). Yo también puedo crearlos con la API de Vercel DNS si me pasás nombre/tipo/valor.
4. En Resend tocá **Verify DNS Records**. Suele demorar ~15 min (hasta 72 h).
5. Una vez *Verified*, en Vercel → Project → Settings → Environment Variables:
   - `RESEND_FROM` = `Condor Nest <hola@condor-nest.lat>`
   - Redeploy production (o esperá el próximo push).
6. Opcional: reenviar confirmaciones a filas de `newsletter_subscribers` con `confirm_mail_error` (tokens viejos vencen a las 48 h; hay que emitir tokens nuevos).

## Search Console / Bing

- Google: agregá propiedad **URL-prefix** `https://condor-nest.lat` (y/o `https://www.condor-nest.lat` si www sigue siendo el que sirve), verificá (puede reusar la meta tag que ya está), enviá `sitemap.xml`.
- Bing: importá desde GSC o agregá el dominio nuevo y el sitemap.
- Los canónicos del sitio apuntan a `https://condor-nest.lat` (ver `lib/site.ts`).
