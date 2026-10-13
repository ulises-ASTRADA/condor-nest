import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListing, getListings } from '@/lib/supabase';
import { SOURCE_LABEL, type Listing } from '@/lib/types';
import { artFull, artShort, competitionText, ELIG_LABEL, rewardText } from '@/lib/format';
import { isOpen, sortListings } from '@/lib/rank';
import { TypeBadge, ModalityBadge, EligBadge } from '@/components/Badges';
import { Countdown } from '@/components/Countdown';
import { ListingCard } from '@/components/ListingCard';
import { Newsletter } from '@/components/Newsletter';
import { ShareButton, CountdownShell } from '@/components/DetailClient';
export const revalidate = 300;

type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const l = await getListing((await params).slug);
  return l ? { title: l.title, openGraph: { title: `${l.title} · Condor Nest`, siteName: 'Condor Nest' } } : { title: 'No encontrado' };
}

function Cta({ l, className = '' }: { l: Listing; className?: string }) {
  const src = l.source === 'superteam' ? 'Superteam' : l.source === 'devpost' ? 'Devpost' : l.source === 'taikai' ? 'Taikai' : l.source === 'luma' ? 'Luma' : null;
  if (!l.applyUrl) return <p className={`grid min-h-14 place-items-center rounded-pill border border-border bg-surface-2 px-6 text-center text-sm text-fg-muted ${className}`}>Link de inscripción: a confirmar</p>;
  const label = src ? `Postulate en ${src}` : 'Postulate en el sitio oficial';
  return (
    <a href={l.applyUrl} target="_blank" rel="noopener" aria-label={`${label} (abre sitio externo)`}
      className={`grid min-h-14 place-items-center rounded-pill bg-lime px-6 font-medium text-primary-fg transition-shadow duration-fast hover:shadow-glow-lime active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${className}`}>{label} ↗</a>
  );
}

export default async function Detail({ params }: P) {
  const { slug } = await params;
  const l = await getListing(slug);
  if (!l) notFound();
  const now = new Date(); const nowIso = now.toISOString();
  const r = rewardText(l); const c = competitionText(l); const open = isOpen(l, now);
  const all = await getListings();
  const similar = sortListings(all.filter((x) => x.id !== l.id && x.type === l.type && isOpen(x, now)), 'cierra-pronto', now).slice(0, 3);
  const srcLabel = SOURCE_LABEL[l.source];
  const dates = [
    l.startsAt && { k: 'Empieza', v: artShort(l.startsAt), iso: l.startsAt },
    l.deadlineAt && { k: 'Cierre', v: artShort(l.deadlineAt), iso: l.deadlineAt },
    l.endsAt && { k: 'Termina', v: artShort(l.endsAt), iso: l.endsAt },
  ].filter(Boolean) as { k: string; v: string; iso: string }[];

  const keyData = (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
      <dt className="text-fg-muted">Premio</dt>
      <dd className={`font-mono tabular ${r.missing ? 'text-fg-muted' : 'text-base'}`}>{r.prefix ? `${r.prefix} ` : ''}{r.main}{r.approx && <span className="block text-fg-muted">{r.approx}</span>}</dd>
      <dt className="text-fg-muted">{l.deadlineAt ? 'Cierre' : 'Fecha'}</dt>
      <dd><CountdownShell><Countdown l={l} initialNow={nowIso} seconds /></CountdownShell>{(l.deadlineAt ?? l.startsAt) && <span className="block font-mono text-xs text-fg-muted">{artShort((l.deadlineAt ?? l.startsAt)!)}</span>}</dd>
      <dt className="text-fg-muted">Compiten</dt><dd className="font-mono tabular">{c.count}</dd>
      <dt className="text-fg-muted">Por {l.competitorsKind === 'registrations' ? 'inscripto' : 'envío'}</dt><dd className="font-mono tabular">{c.ratio?.replace(/ por .*/, '') ?? 'Sin dato'}</dd>
      <dt className="text-fg-muted">Elegibilidad</dt><dd>{ELIG_LABEL[l.eligibility]}{l.eligibilityNote && <span className="block text-fg-muted">{l.eligibilityNote}</span>}</dd>
      <dt className="text-fg-muted">Modalidad</dt><dd>{l.modality === 'online' ? 'Online' : l.modality === 'irl' ? 'IRL' : 'Híbrido'}{l.city ? ` · ${l.city}` : ''}</dd>
    </dl>
  );

  return (
    <>
      <div className="reading-progress fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-grad-brand" aria-hidden="true" />
      <div className="flex items-center justify-between pt-3">
        <Link href="/" className="inline-flex min-h-tap items-center text-sm text-fg-muted hover:text-lime">← Volver</Link>
        <ShareButton title={l.title} />
      </div>
      {!open && (
        <div role="status" className="mt-2 rounded-card border border-border bg-surface-2 p-4 text-sm">Esta convocatoria cerró el {artFull((l.deadlineAt ?? l.startsAt)!)}. <a href="#similares" className="text-lime hover:underline">Mirá similares abiertas.</a></div>
      )}
      <div className="mt-2 grid gap-8 lg:grid-cols-3">
        <article className="min-w-0 lg:col-span-2">
          <div className="flex flex-wrap gap-1.5"><TypeBadge type={l.type} /><ModalityBadge l={l} /><EligBadge l={l} /></div>
          <h1 lang={l.titleLang === 'en' ? 'en' : undefined} className="mt-3 font-display text-3xl font-semibold" style={{ viewTransitionName: `listing-${l.id}` }}>{l.title}</h1>
          <p className="mt-2 text-sm text-fg-muted">{l.organizer && <>por {l.organizer} · </>}<a href={l.sourceUrl} target="_blank" rel="noopener" aria-label={`vía ${srcLabel} (abre sitio externo)`} className="hover:text-lime">vía {srcLabel} ↗</a></p>
          {l.disclosureKey === 'belo' && (
            <div className="mt-4 rounded-card bg-surface-2 p-4 text-sm" role="note">
              <span aria-hidden="true">ⓘ </span><strong>Transparencia:</strong> Ulises, creador de Condor Nest, trabaja en belo, organizador de este hackathon. Lo listamos con los mismos criterios que cualquier otro evento {l.featured ? 'y este espacio es Destacado.' : 'y no está pagado como Destacado.'}
            </div>
          )}
          {!r.missing && <p className="mt-6 font-display text-5xl font-extrabold tabular max-sm:text-3xl"><span className="text-gradient">{r.main}</span></p>}
          <section className="mt-6 rounded-card border border-border bg-surface p-4 lg:hidden" aria-label="Datos clave"><h2 className="mb-3 font-medium">Datos clave</h2>{keyData}</section>
          <section className="mt-8">
            <h2 className="font-medium text-lg">Resumen en español</h2>
            {l.summaryEs?.length ? <ul className="mt-2 list-disc space-y-1 pl-5">{l.summaryEs.map((b, i) => <li key={i}>{b}</li>)}</ul> : <p className="mt-2 text-fg-muted">Sin dato. Mirá la fuente oficial.</p>}
            <p className="mt-2 text-xs text-fg-muted">Resumen automático en español. Revisá siempre la fuente oficial.</p>
          </section>
          <section className="mt-8">
            <h2 className="font-medium text-lg">Fechas (hora de Argentina)</h2>
            {dates.length ? <ol className="mt-2 space-y-2 border-l border-border pl-4">{dates.map((d) => <li key={d.k}><span className="text-fg-muted">{d.k}:</span> <time dateTime={d.iso} className="font-mono">{d.v}</time></li>)}</ol> : <p className="mt-2 text-fg-muted">Sin dato</p>}
            {(l.deadlineAt || l.startsAt) && <a href={`/o/${l.slug}/ics`} className="mt-3 inline-flex min-h-tap items-center rounded-pill border border-lime/60 px-4 text-sm text-lime hover:shadow-glow-lime">Agregar al calendario</a>}
          </section>
          {l.verifiedUrl && (
            <p className="mt-6 text-xs text-fg-muted">Verificado en la página oficial: <a className="hover:text-lime" href={l.verifiedUrl} target="_blank" rel="noopener">{new URL(l.verifiedUrl).hostname} ↗</a>{l.sourcePostUrl && <> · Lo vimos en <a className="hover:text-lime" href={l.sourcePostUrl} target="_blank" rel="noopener">este post de X ↗</a></>}</p>
          )}
          <section id="similares" className="mt-10">
            <h2 className="font-medium text-lg">Similares</h2>
            {similar.length ? <ul className="mt-3 grid gap-3">{similar.map((s) => <li key={s.id}><ListingCard listing={s} variant="compact" now={nowIso} /></li>)}</ul> : <p className="mt-2 text-fg-muted">Sin dato</p>}
          </section>
          <div className="mt-8"><Newsletter variant="inline" /></div>
        </article>
        <aside className="hidden lg:block"><div className="sticky top-20 space-y-4 rounded-card border border-border bg-surface p-5"><h2 className="font-medium">Datos clave</h2>{keyData}<Cta l={l} /></div></aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden"><Cta l={l} /></div>
    </>
  );
}
