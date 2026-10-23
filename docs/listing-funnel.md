# Embudo de fichas y destacados

La instrumentación está en el código y la migración `20261023023000_listing_funnel.sql`. **No está activa hasta migrar la base, desplegar el código y poner ambas variables `LISTING_ANALYTICS_ENABLED=1` y `NEXT_PUBLIC_LISTING_ANALYTICS_ENABLED=1` en Production.** En local y preview, el API descarta los eventos. Si un navegador de QA debe quedar fuera de la instrumentación y Vercel Analytics, usar `localStorage.setItem('cn-analytics-opt-out','1')` antes de navegar. El contador anterior de `/go/` tiene su propio filtrado y no usa este opt-out.

Una impresión requiere que al menos el 50% de la tarjeta esté en el viewport durante un segundo con la página visible. Se registran `impression`, `card_click` y `detail_view` con evento, página pública, ubicación (`featured`, `organic`, `related`, `detail`) y posición visual. El clic saliente en `/go/<slug>` conserva una referencia opaca a la exposición cuando viene de una tarjeta. La referencia vence para atribución a los 30 minutos y debe corresponder a un `card_click` real de la misma ficha. Las tarjetas en hubs cuentan como `organic`; las sugerencias dentro de otras fichas, como `related`.

`cn_listing_funnel_daily` resume por cohorte de primera exposición, ficha, página, ubicación, posición y campaña. `card_ctr_percent` usa **clics de tarjeta con impresión visible** / **impresiones visibles**. Los clics rápidos, antes del segundo de visibilidad, aparecen en `card_clicks` pero no inflan ese CTR. Las vistas de ficha y los clics de inscripción atribuidos aparecen en las columnas siguientes. Los visitantes que llegan directo o desde Google siguen estando en Vercel; no se atribuyen artificialmente a una tarjeta.

`cn_promotion_campaigns` es un registro privado de campañas con fechas y costo real en centavos de USD. Hay que agregar una campaña de forma manual **solo después de confirmar que corresponde a un espacio pago**. Los destacados editoriales configurados en `lib/featured.ts` se miden como ubicación `featured` y quedan con `campaign_id` nulo. La activación o cobro no se infieren del precio cotizado ni de una solicitud de formulario. Los períodos de una misma ficha no pueden solaparse.

Consulta de comparación en el SQL Editor privado:

```sql
select placement,
  sum(impressions) as impresiones_visibles,
  sum(card_clicks) as clics_tarjeta,
  sum(viewable_card_clicks) as clics_con_impresion,
  round(100.0*sum(viewable_card_clicks)/nullif(sum(impressions),0),2) as ctr_tarjeta_pct,
  sum(detail_views) as vistas_ficha_atribuidas,
  sum(outbound_clicks) as salidas_atribuidas
from public.cn_listing_funnel_daily
where cohort_day_utc >= current_date - 30 and placement in ('featured','organic')
group by placement;
```

Para una campaña con costo registrado:

```sql
select c.id, f.listing_slug, c.paid_usd_cents,
  sum(f.impressions) as impresiones_visibles,
  sum(f.outbound_clicks) as salidas_atribuidas,
  round(c.paid_usd_cents::numeric/100/nullif(sum(f.outbound_clicks),0),2) as usd_por_salida
from public.cn_promotion_campaigns c
join public.cn_listing_funnel_daily f on f.campaign_id=c.id
where c.paid_usd_cents is not null
group by c.id,f.listing_slug,c.paid_usd_cents;
```

El costo por salida usa el gasto completo de la campaña: consultar cuando ya terminó o indicar que el período de medición sigue abierto. No es costo por inscripción completada. Para medir inscripciones haría falta una confirmación del organizador o integración de conversión. Para estimar incremento causal del destacado haría falta comparar la misma ficha en ventanas comparables o hacer un experimento; el CTR agregado de dos ubicaciones por sí solo no prueba ese incremento.

No se guardan IP, user-agent, correos, nombres, cookies ni parámetros privados. UUIDs aleatorios relacionan los pasos de una exposición durante un período corto; los URL públicos llevan `cn_entry` únicamente para conservar la atribución dentro de la navegación. Vercel Analytics quita ese parámetro antes de enviar la vista. RLS y permisos impiden la lectura pública de las tablas y la vista. El API valida origen, ruta, tipo, tamaño, volumen y bots conocidos; el rate limit en memoria es por instancia, así que estos datos sirven para evaluación de producto, no como fuente antifraude o facturación automática.

Pruebas realizadas en una base PostgreSQL desechable y en Chrome local con fichas ficticias: migración, permisos, campañas solapadas, reintentos, atribución cruzada, expiración, visibilidad, recorrido al enlace externo y opt-out. No se generaron eventos de prueba en la base de producción.
