import { OG_IMAGE } from '@/lib/site';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListing, getListings } from '@/lib/supabase';
import { SOURCE_LABEL, type Listing } from '@/lib/types';
import { LocalTime } from '@/components/LocalTime';
import { competitionText, ELIG_LABEL, rewardText, TYPE_LABEL } from '@/lib/format';
import { COUNTRY_ES } from '@/lib/geo';
import { isOpen, sortListings } from '@/lib/rank';
import { TypeBadge, ModalityBadge, EligBadge } from '@/components/Badges';
import { Countdown } from '@/components/Countdown';
import { ListingCard } from '@/components/ListingCard';
import { Newsletter } from '@/components/Newsletter';
import { ShareButton, CountdownShell } from '@/components/DetailClient';
import { eventLd, ldScript } from '@/lib/jsonld';
import { SITE } from '@/lib/site';
export const revalidate = 300;

const AR = 'America/Argentina/Buenos_Aires';
const longDate = (iso: string) => new Intl.DateTimeFormat('es-AR', { timeZone: AR, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
const shortDate = (iso: string) => new Intl.DateTimeFormat('es-AR', { timeZone: AR, day: 'numeric', month: 'long' }).format(new Date(iso));
const numDate = (iso: string) => new Intl.DateTimeFormat('es-AR', { timeZone: AR, day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
/** Prize phrase from real data only, or null. */
function prizePhrase(l: Listing): string | null {
  const r = rewardText(l);
  if (!r.missing) return `${r.prefix ? r.prefix.toLowerCase() + ' ' : ''}${r.main}`;
  if (l.rewardText && l.rewardText.length <= 40) return l.rewardText.replace(/^premios?:?\s*/i, '');
  return null;
}
const closeIso = (l: Listing) => l.deadlineAt ?? l.endsAt ?? null;
const whoText = (l: Listing) => l.eligibilityShort ?? (l.eligibility === 'unknown' ? null : ELIG_LABEL[l.eligibility]) ?? (l.country && COUNTRY_ES[l.country] ? COUNTRY_ES[l.country] : null);
const modalityText = (l: Listing) => (l.modality === 'online' ? 'online' : l.modality === 'irl' ? 'presencial' : 'híbrida') + (l.city && l.modality !== 'online' ? ` en ${l.city}` : '');

type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const l = await getListing((await params).slug);
  if (!l) return { title: 'No encontrado', robots: { index: false } };
  const prize = prizePhrase(l); const close = closeIso(l); const open = isOpen(l, new Date());
  const tail = [prize && `premio ${prize}`, close && `${open ? 'cierra' : 'cerró'} ${shortDate(close)}`].filter(Boolean).join(', ');
  const title = `${l.title}${tail ? ` — ${tail}` : ''} | Condor Nest`;
  const who = whoText(l);
  const description = [`${TYPE_LABEL[l.type]} ${modalityText(l)}${l.organizer ? ` de ${l.organizer}` : ''}.`, who && `Pueden participar: ${who}.`, prize && `Premio: ${prize}.`, close && `${open ? 'Cierra' : 'Cerró'} el ${longDate(close)}.`, 'Resumen en español, fechas en tu hora y link oficial.'].filter(Boolean).join(' ').slice(0, 300);
  return { title: { absolute: title }, description, alternates: { canonical: `/o/${l.slug}` }, openGraph: { images: [OG_IMAGE], title, description, siteName: 'Condor Nest', url: `/o/${l.slug}`, locale: 'es_AR', type: 'website' } };
}

function Cta({ l, className = '' }: { l: Listing; className?: string }) {
  const src = l.source === 'superteam' ? 'Superteam' : l.source === 'devpost' ? 'Devpost' : l.source === 'taikai' ? 'Taikai' : l.source === 'luma' ? 'Luma' : null;
  if (!l.applyUrl) return <p className={`grid min-h-14 place-items-center rounded-pill border border-border bg-surface-2 px-6 text-center text-sm text-fg-muted ${className}`}>Link de inscripción: a confirmar</p>;
  const label = src ? `Postulate en ${src}` : 'Postulate en el sitio oficial';
  return (
    <a href={l.applyUrl} target="_blank" rel="noopener noreferrer" aria-label={`${label} (abre sitio externo)`}
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
  const score = (x: Listing) => (l.country && x.country === l.country ? 2 : 0) + (x.type === l.type ? 1 : 0) + (x.ecosystems.some((e) => l.ecosystems.includes(e)) ? 1 : 0);
  const cands = sortListings(all.filter((x) => x.id !== l.id && isOpen(x, now) && score(x) > 0), 'cierra-pronto', now);
  const similar = cands.map((x, i) => ({ x, i, s: score(x) })).sort((a, b) => b.s - a.s || a.i - b.i).slice(0, 4).map((o) => o.x);
  const prize = prizePhrase(l); const close = closeIso(l); const who = whoText(l);
  const officialUrl = l.verifiedUrl ?? l.applyUrl ?? l.sourceUrl;
  let officialHost: string | null = null; try { officialHost = officialUrl ? new URL(officialUrl).hostname.replace(/^www\./, '') : null; } catch {}
  const updated = l.updatedAt || l.createdAt;
  const srcLabel = SOURCE_LABEL[l.source];
  const dates = [
    l.startsAt && { k: 'Empieza', v: l.startsAt, iso: l.startsAt },
    l.deadlineAt && { k: 'Cierre', v: l.deadlineAt, iso: l.deadlineAt },
    l.endsAt && { k: 'Termina', v: l.endsAt, iso: l.endsAt },
  ].filter(Boolean) as { k: string; v: string; iso: string }[];

  const keyData = (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
      <dt className="text-fg-muted">Premio</dt>
      <dd className={`font-mono tabular ${r.missing ? 'text-fg-muted' : 'text-base'}`}>{r.prefix ? `${r.prefix} ` : ''}{r.main}{r.approx && <span className="block text-fg-muted">{r.approx}</span>}{r.detail && <span className="block font-sans text-sm text-fg-muted">{r.detail}</span>}</dd>
      <dt className="text-fg-muted">{l.deadlineAt ? 'Cierre' : 'Fecha'}</dt>
      <dd><CountdownShell><Countdown l={l} initialNow={nowIso} seconds /></CountdownShell>{(l.deadlineAt ?? l.startsAt) && <span className="block font-mono text-xs text-fg-muted"><LocalTime iso={(l.deadlineAt ?? l.startsAt)!} /></span>}</dd>
      <dt className="text-fg-muted">Compiten</dt><dd className="font-mono tabular">{c.count}</dd>
      <dt className="text-fg-muted">Por {l.competitorsKind === 'registrations' ? 'inscripto' : 'envío'}</dt><dd className="font-mono tabular">{c.ratio?.replace(/ por .*/, '') ?? 'Sin dato'}</dd>
      <dt className="text-fg-muted">Elegibilidad</dt><dd>{ELIG_LABEL[l.eligibility]}{l.eligibilityNote && <span className="block text-fg-muted">{l.eligibilityNote}</span>}</dd>
      <dt className="text-fg-muted">Modalidad</dt><dd>{l.modality === 'online' ? 'Online' : l.modality === 'irl' ? 'IRL' : 'Híbrido'}{l.city ? ` · ${l.city}` : ''}</dd>
    </dl>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript({ '@context': 'https://schema.org', '@graph': [eventLd(l), { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Condor Nest', item: SITE }, { '@type': 'ListItem', position: 2, name: l.title, item: `${SITE}/o/${l.slug}` }] }].filter(Boolean) })} />
      <div className="reading-progress fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-grad-brand" aria-hidden="true" />
      <div className="flex items-center justify-between pt-3">
        <nav aria-label="Migas de pan" className="min-w-0 text-sm text-fg-muted"><ol className="flex min-h-tap items-center gap-1.5"><li><Link href="/" className="hover:text-lime">Condor Nest</Link></li><li aria-hidden="true">›</li><li className="truncate" aria-current="page">{l.title}</li></ol></nav>
        <ShareButton title={l.title} />
      </div>
      {!open && (
        <div role="status" className="mt-2 rounded-card border border-border bg-surface-2 p-4 text-sm"><span className="mr-2 rounded-pill bg-danger/15 px-2 py-0.5 font-mono text-xs uppercase tracking-[.08em] text-danger">Cerrada</span>Esta convocatoria cerró{(l.deadlineAt ?? l.endsAt ?? l.startsAt) && <> el <LocalTime iso={(l.deadlineAt ?? l.endsAt ?? l.startsAt)!} format="full" /></>}. <a href="#similares" className="text-lime hover:underline">Mirá similares abiertas.</a></div>
      )}
      <div className="mt-2 grid gap-8 lg:grid-cols-3">
        <article className="min-w-0 lg:col-span-2">
          <div className="flex flex-wrap gap-1.5">{!open && <span className="inline-flex items-center rounded-pill border border-danger/50 px-2.5 py-0.5 font-mono text-xs uppercase tracking-[.08em] text-danger">Cerrada</span>}<TypeBadge type={l.type} /><ModalityBadge l={l} /><EligBadge l={l} /></div>
          <h1 lang={l.titleLang === 'en' ? 'en' : undefined} className="mt-3 font-display text-3xl font-semibold" style={{ viewTransitionName: `listing-${l.id}` }}>{l.title}</h1>
          <p className="mt-2 text-sm text-fg-muted">{l.organizer && <>por {l.organizer} · </>}{l.sourceUrl ? <a href={l.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`vía ${srcLabel} (abre sitio externo)`} className="hover:text-lime">vía {srcLabel} ↗</a> : null}</p>
          <p className="mt-1 font-mono text-xs text-fg-muted">Actualizado el <time dateTime={updated}>{numDate(updated)}</time></p>
          <section aria-label="En pocas palabras" className="mt-5 rounded-card border border-border bg-surface p-4 text-[15px] leading-relaxed">
            <p><strong>{l.title}</strong> es {l.type === 'grant' ? 'un grant' : l.type === 'bounty' ? 'un bounty' : 'una hackathon'} {modalityText(l)}{l.organizer ? <> de {l.organizer}</> : null}.{who && <> Pueden participar: {who}.</>}</p>
            <p className="mt-1">{prize ? <>Premio: {prize}. </> : null}{close ? <>{open ? 'Cierra' : 'Cerró'} el {longDate(close)} (hora de Argentina).</> : <>Cierre: sin fecha publicada.</>}{officialUrl && officialHost && <> Link oficial: <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="text-lime hover:underline">{officialHost} ↗</a></>}</p>
          </section>
          {!r.missing && <p className="mt-6 font-display text-5xl font-extrabold tabular max-sm:text-3xl"><span className="text-gradient">{r.main}</span></p>}
          {!r.missing && r.detail && <p className="mt-2 text-fg-muted">{r.detail}</p>}
          {r.missing && l.rewardText && <p className="mt-6 rounded-card border border-lime/40 bg-surface-2 p-4 text-lg"><span className="font-mono text-xs uppercase tracking-[.08em] text-lime">Premios</span><span className="mt-1 block">{l.rewardText}</span></p>}
          <section className="mt-6 rounded-card border border-border bg-surface p-4 lg:hidden" aria-label="Datos clave"><h2 className="mb-3 font-medium">Datos clave</h2>{keyData}</section>
          <section className="mt-8">
            <h2 className="font-medium text-lg">Resumen en español</h2>
            {l.summaryEs?.length ? <ul className="mt-2 list-disc space-y-1 pl-5">{l.summaryEs.map((b, i) => <li key={i}>{b}</li>)}</ul> : <p className="mt-2 text-fg-muted">Sin dato. Mirá la fuente oficial.</p>}
            <p className="mt-2 text-xs text-fg-muted">Resumen automático en español. Revisá siempre la fuente oficial.</p>
          </section>
          <section className="mt-8">
            <h2 className="font-medium text-lg">Fechas (tu hora local)</h2>
            {dates.length ? <ol className="mt-2 space-y-2 border-l border-border pl-4">{dates.map((d) => <li key={d.k}><span className="text-fg-muted">{d.k}:</span> <LocalTime iso={d.v} className="font-mono" /></li>)}</ol> : <p className="mt-2 text-fg-muted">Sin dato</p>}
            {(l.deadlineAt || l.startsAt) && <a href={`/o/${l.slug}/ics`} className="mt-3 inline-flex min-h-tap items-center rounded-pill border border-lime/60 px-4 text-sm text-lime hover:shadow-glow-lime">Agregar al calendario</a>}
          </section>
          {l.verifiedUrl && (
            <p className="mt-6 text-xs text-fg-muted">Verificado en la página oficial: <a className="hover:text-lime" href={l.verifiedUrl} target="_blank" rel="noopener noreferrer">{new URL(l.verifiedUrl).hostname} ↗</a>{l.sourcePostUrl && <> · Lo vimos en <a className="hover:text-lime" href={l.sourcePostUrl} target="_blank" rel="noopener noreferrer">este post de X ↗</a></>}</p>
          )}
          <section id="similares" className="mt-10">
            <h2 className="font-medium text-lg">Oportunidades similares{open ? '' : ' abiertas'}</h2>
            {similar.length ? <ul className="mt-3 grid gap-3">{similar.map((s) => <li key={s.id}><ListingCard listing={s} variant="compact" now={nowIso} /></li>)}</ul> : <p className="mt-2 text-fg-muted">Por ahora no hay otras abiertas parecidas. <Link href="/" className="text-lime hover:underline">Mirá todas las oportunidades</Link>.</p>}
          </section>
          <div className="mt-8"><Newsletter variant="inline" /></div>
        </article>
        <aside className="hidden lg:block"><div className="sticky top-20 space-y-4 rounded-card border border-border bg-surface p-5"><h2 className="font-medium">Datos clave</h2>{keyData}<Cta l={l} /></div></aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden"><Cta l={l} /></div>
    </>
  );
}
