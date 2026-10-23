'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { OrgAbout as O } from '@/lib/organizer';

/** "Sobre el organizador" card. Plain text only (React escapes; never HTML). */
export function OrgAbout({ name, about }: { name: string; about: O }) {
  const [open, setOpen] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const descriptionId = useId();
  useEffect(() => {
    const element = descriptionRef.current;
    if (!element) return;
    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      setCanExpand(element.scrollHeight > lineHeight * 3 + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [about.description]);
  const site = about.website ?? about.sourceUrl;
  const logoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(site).hostname)}&sz=128`;
  return (
    <section aria-label="Sobre el organizador" className="mt-6 min-w-0 rounded-[12px] border border-border bg-surface p-4" data-block="sobre-organizador">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 font-sans text-base font-semibold">
          {failedLogo === logoUrl ? name.trim()[0]?.toUpperCase() : <img src={logoUrl} alt="" width={40} height={40} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedLogo(logoUrl)} className="h-full w-full object-cover" />}
        </span>
        <div className="min-w-0"><h2 id="sobre-org" className="font-sans text-base font-semibold">Sobre el organizador</h2><p className="truncate text-sm text-fg-muted">{name}</p></div>
      </div>
      <p ref={descriptionRef} id={descriptionId} className={`mt-3 text-[15px] leading-[22px] ${open ? '' : 'line-clamp-3'}`}>{about.description}</p>
      {canExpand && <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={descriptionId} className="mt-1 min-h-tap text-sm text-lime hover:underline">{open ? 'Ver menos' : 'Ver más'}</button>}
      <div className="mt-2 flex flex-wrap items-center gap-x-4">
        <a href={site} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-tap items-center text-sm text-lime hover:underline">Sitio oficial ↗</a>
        <span className="text-xs text-fg-muted">Fuente: {about.sourceHost}</span>
      </div>
    </section>
  );
}
