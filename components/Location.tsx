'use client';
import { useState } from 'react';

export function Location({ name, address }: { name: string; address: string }) {
  const [show, setShow] = useState(false);
  const q = encodeURIComponent(`${name}, ${address}`);
  return (
    <section className="mt-6 min-w-0 rounded-card border border-border bg-surface p-4" aria-label="Ubicación">
      <h2 className="font-medium">Ubicación</h2>
      <p className="mt-2">{name}</p>
      <p className="text-fg-muted">{address}</p>
      <div className="mt-3 h-[150px] overflow-hidden rounded-card border border-border bg-bg">
        {show ? (
          <iframe title={`Mapa de ${name}`} src={`https://www.google.com/maps?q=${q}&output=embed`} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        ) : (
          <button type="button" onClick={() => setShow(true)} className="flex h-full w-full items-center justify-center text-sm text-fg-muted hover:text-fg">Ver mapa (carga Google Maps)</button>
        )}
      </div>
      <a href={`https://www.google.com/maps/dir/?api=1&destination=${q}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center rounded-pill border border-lime px-4 font-medium">Cómo llegar ↗</a>
    </section>
  );
}
