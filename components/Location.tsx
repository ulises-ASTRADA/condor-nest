'use client';
import { useState } from 'react';

type Official = { href: string; host: string; rel: string } | null;

/** Map card. venue mode: exact place from the official source (pin + "Cómo llegar"). city mode: the source only publishes the city,
 *  so the map shows the city without a pin and links to the official page instead of giving directions. */
export function Location({ name, address, mode = 'venue', official = null }: { name: string; address: string; mode?: 'venue' | 'city'; official?: Official }) {
  const [show, setShow] = useState(false);
  const city = mode === 'city';
  const q = encodeURIComponent(city ? address : `${name}, ${address}`);
  const label = city ? address : name;
  return (
    <section className="mt-6 min-w-0 rounded-card border border-border bg-surface p-4" aria-label="Ubicación">
      <h2 className="font-medium">Ubicación</h2>
      <p className="mt-2">{name}</p>
      {city ? <p className="text-fg-muted">La organización todavía no publicó la dirección exacta.</p> : <p className="text-fg-muted">{address}</p>}
      <div className="mt-3 h-[150px] overflow-hidden rounded-card border border-border bg-bg">
        {show ? (
          <iframe title={`Mapa de ${label}`} src={`https://www.google.com/maps?q=${q}${city ? '&z=11' : ''}&output=embed`} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        ) : (
          <button type="button" onClick={() => setShow(true)} aria-label={`Ver mapa de ${label}`} className="relative h-full w-full" style={{ backgroundImage: 'linear-gradient(rgb(var(--border)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--border)) 1px, transparent 1px), linear-gradient(35deg, transparent 48%, rgb(var(--border)) 48%, rgb(var(--border)) 52%, transparent 52%)', backgroundSize: '28px 28px, 28px 28px, 100% 100%' }}>
            {!city && <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-full rotate-45 rounded-full rounded-br-none bg-lime" />}
            <span className="absolute bottom-2 right-2 rounded-pill bg-surface px-3 py-1 font-mono text-xs uppercase tracking-[.08em] text-fg">{city ? 'Ver ciudad' : 'Ver mapa'}</span>
          </button>
        )}
      </div>
      {city
        ? official && <a href={official.href} target="_blank" rel={official.rel} className="mt-3 flex min-h-11 w-full items-center justify-center rounded-pill border border-lime px-4 font-medium text-lime">Ver sede en {official.host} ↗</a>
        : <a href={`https://www.google.com/maps/dir/?api=1&destination=${q}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-11 w-full items-center justify-center rounded-pill border border-lime px-4 font-medium text-lime">Cómo llegar ↗</a>}
    </section>
  );
}

/** No map: online events, or in-person ones whose source publishes no venue or city. One line plus the official link. */
export function LocationNote({ text, official }: { text: 'Online' | 'Sede a confirmar'; official: Official }) {
  return (
    <section className="mt-6 min-w-0 rounded-card border border-border bg-surface p-4" aria-label="Ubicación">
      <h2 className="font-medium">Ubicación</h2>
      <p className="mt-2">{text}{official && <> · <a href={official.href} target="_blank" rel={official.rel} className="text-lime hover:underline">{text === 'Online' ? 'Detalles' : 'Novedades'} en {official.host} ↗</a></>}</p>
    </section>
  );
}
