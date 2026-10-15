import Link from 'next/link';
import { ReduceMotionToggle } from './Toggles';
import { Newsletter } from './Newsletter';
import { HUBS } from '@/lib/hubs';
export function Footer() {
  return (
    <footer className="border-t border-border bg-bg/80">
      <div className="mx-auto grid max-w-content gap-6 px-4 py-8 lg:px-6">
        <div className="lg:hidden"><Newsletter variant="mini" /></div>
        <div className="space-y-3 text-sm text-fg-muted">
          <nav aria-label="Pie" className="flex flex-wrap gap-x-4 gap-y-1">
            <Link className="min-h-tap inline-flex items-center hover:text-fg" href="/acerca">Acerca</Link>
            <Link className="min-h-tap inline-flex items-center hover:text-fg" href="/publicar">Publicá tu evento</Link>
          </nav>
          <nav aria-label="Explorar" className="flex flex-wrap items-center gap-x-4 gap-y-1"><span className="font-mono text-[11px] uppercase tracking-[.12em] text-cyan">Explorar</span>{HUBS.map((h) => <Link key={h.slug} className="min-h-tap inline-flex items-center hover:text-fg" href={`/${h.slug}`}>{h.label}</Link>)}</nav>
          <p>Hecho en Córdoba para builders de LatAm · Datos de Superteam Earn, Devpost, Taikai y curación propia</p>
          <ReduceMotionToggle />
        </div>
      </div>
    </footer>
  );
}
