'use client';
import { useState } from 'react';
import type { OrgAbout as O } from '@/lib/organizer';

/** "Sobre {empresa}" card. Plain text only (React escapes; never HTML). */
export function OrgAbout({ name, about }: { name: string; about: O }) {
  const [open, setOpen] = useState(false);
  const long = about.description.length > 110;
  const site = about.website ?? about.sourceUrl;
  return (
    <section aria-labelledby="sobre-org" className="mt-6 min-w-0 rounded-[12px] border border-border bg-surface p-4" data-block="sobre-organizador">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 font-sans text-base font-semibold">{name.trim()[0]?.toUpperCase()}</span>
        <h2 id="sobre-org" className="font-sans text-base font-semibold">Sobre {name}</h2>
      </div>
      <p className={`mt-3 text-[15px] leading-[22px] ${open ? '' : 'line-clamp-3'}`}>{about.description}</p>
      {long && <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-1 min-h-tap text-sm text-lime hover:underline">{open ? 'Ver menos' : 'Ver más'}</button>}
      <div className="mt-2 flex flex-wrap items-center gap-x-4">
        <a href={site} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-tap items-center text-sm text-lime hover:underline">Sitio oficial ↗</a>
        <span className="text-xs text-fg-muted">Fuente: {about.sourceHost}</span>
      </div>
    </section>
  );
}
