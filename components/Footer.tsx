import Link from 'next/link';
import { ReduceMotionToggle } from './Toggles';
import { Newsletter } from './Newsletter';
export function Footer() {
  return (
    <footer className="border-t border-border bg-bg/80">
      <div className="mx-auto grid max-w-content gap-8 px-4 py-10 lg:grid-cols-2 lg:px-6">
        <Newsletter variant="footer" />
        <div className="space-y-3 text-sm text-fg-muted">
          <nav aria-label="Pie" className="flex flex-wrap gap-x-4 gap-y-1">
            <Link className="min-h-tap inline-flex items-center hover:text-fg" href="/acerca">Acerca</Link>
            <Link className="min-h-tap inline-flex items-center hover:text-fg" href="/publicar">Publicá tu evento</Link>
            <Link className="min-h-tap inline-flex items-center hover:text-fg" href="/acerca#divulgacion">Divulgación belo</Link>
          </nav>
          <p>Hecho en Buenos Aires para builders de LatAm · Datos de Superteam Earn, Devpost, Taikai y curación propia · Ulises, creador de Condor Nest, trabaja en belo. <Link href="/acerca#divulgacion" className="text-lime underline-offset-4 hover:underline">Ver divulgación →</Link></p>
          <ReduceMotionToggle />
        </div>
      </div>
    </footer>
  );
}
