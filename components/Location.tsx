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
          <button type="button" onClick={() => setShow(true)} aria-label={`Ver mapa de ${name}`} className="relative h-full w-full" style={{ backgroundImage: 'linear-gradient(rgb(var(--border)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--border)) 1px, transparent 1px), linear-gradient(35deg, transparent 48%, rgb(var(--border)) 48%, rgb(var(--border)) 52%, transparent 52%)', backgroundSize: '28px 28px, 28px 28px, 100% 100%' }}>
            <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-full rotate-45 rounded-full rounded-br-none bg-lime" />
            <span className="absolute bottom-2 right-2 rounded-pill bg-surface px-3 py-1 font-mono text-xs uppercase tracking-[.08em] text-fg">Ver mapa</span>
          </button>
        )}
      </div>
      <a href={`https://www.google.com/maps/dir/?api=1&destination=${q}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-11 w-full items-center justify-center rounded-pill border border-lime px-4 font-medium text-lime">Cómo llegar ↗</a>
    </section>
  );
}
