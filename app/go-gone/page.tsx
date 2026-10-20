import Link from 'next/link';
import type { Metadata } from 'next';
import { PRIMARY } from '../newsletter/confirmar/styles';
// Same layout and card as /newsletter/baja. Source of the /go/<slug> "not published" page: app/go/[slug]/route.ts fetches
// this static page, strips every <script>, and serves it with status 404 + no-store/noindex/no-referrer at the /go/ URL.
// (A notFound()/404-status render would ship an empty body that only fills in with JS.) Rendered as a normal static page.
export const metadata: Metadata = { title: 'Convocatoria no publicada', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export const dynamic = 'force-static';
// Same primary button as /newsletter/baja; the longer label may wrap on narrow phones, so the height grows instead of clipping.
const BTN = PRIMARY.replace('h-12', 'min-h-12 py-2 leading-tight text-balance').replace('px-6', 'px-5');
export default function GoGone() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 py-16">
      <section data-state="no-publicada" className="w-full rounded-card border border-violet/35 p-6 text-center sm:p-8 [background:radial-gradient(120%_140%_at_0%_0%,rgb(var(--violet)/.18),transparent_60%),rgb(var(--surface))]">
        <p className="font-mono text-xs tracking-[.18em] text-lime">NO DISPONIBLE</p>
        <h1 className="mt-3 font-display text-2xl font-semibold">Esta convocatoria ya no está publicada</h1>
        <p className="mt-3 text-fg-muted">Puede que haya cerrado o que haya cambiado de link.</p>
        <div><Link href="/" className={BTN}>Ver convocatorias abiertas</Link></div>
      </section>
    </div>
  );
}
