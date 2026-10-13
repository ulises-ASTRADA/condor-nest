'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence, LayoutGroup, useReducedMotion, useSpring, useTransform } from 'motion/react';
import Link from 'next/link';
import type { Listing, ListingType } from '@/lib/types';
import { DEFAULT_FILTERS, SORTS, filtersToSearch, matches, sortListings, isOpen, effDeadline, type Filters, type Sort } from '@/lib/rank';
import { ListingCard } from './ListingCard';
import { Newsletter } from './Newsletter';
import { Affiliate } from './Affiliate';
import { useReduceMotionPref } from './Toggles';

const PAGE = 20;
const ease = [0.16, 1, 0.3, 1] as const;

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className="group relative flex min-h-tap shrink-0 items-center focus-visible:outline-none">
      <span className={`inline-flex h-9 items-center rounded-pill border px-3 text-sm transition-[background-color,color,box-shadow] duration-instant group-focus-visible:ring-2 group-focus-visible:ring-lime ${on ? 'border-lime bg-lime text-primary-fg shadow-glow-lime' : 'border-border bg-surface-2 text-fg hover:border-lime/60'}`}>{children}</span>
    </button>
  );
}

function Counter({ n, still }: { n: number; still: boolean }) {
  const s = useSpring(n, { duration: 420, bounce: 0 });
  const t = useTransform(s, (v) => Math.round(v).toLocaleString('es-AR'));
  useEffect(() => { if (still) s.jump(n); else s.set(n); }, [n, still, s]);
  return (
    <>
      <span aria-hidden="true" className="font-mono tabular"><m.span>{t}</m.span> {n === 1 ? 'oportunidad' : 'oportunidades'}</span>
      <span className="sr-only" aria-live="polite">{n} {n === 1 ? 'oportunidad' : 'oportunidades'}</span>
    </>
  );
}

export function Feed({ listings, now, initial }: { listings: Listing[]; now: string; initial: { f: Filters; sort: Sort } }) {
  const [f, setF] = useState<Filters>(initial.f);
  const [sort, setSort] = useState<Sort>(initial.sort);
  const [limit, setLimit] = useState(PAGE);
  const still = !!useReducedMotion() || useReduceMotionPref();
  const [lowEnd, setLowEnd] = useState(false);
  const first = useRef(true);
  const nowD = useMemo(() => new Date(now), [now]);

  useEffect(() => {
    setLowEnd((navigator.hardwareConcurrency ?? 8) <= 4);
  }, []);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const qs = filtersToSearch(f, sort);
    window.history.replaceState(null, '', qs ? `/?${qs}` : '/');
  }, [f, sort]);

  const featured = useMemo(() => listings.filter((l) => l.featured && matches(l, f, nowD)).slice(0, 1), [listings, f, nowD]);
  const organic = useMemo(() => sortListings(listings.filter((l) => !l.featured && matches(l, f, nowD)), sort, nowD), [listings, f, sort, nowD]);
  const shown = organic.slice(0, limit);
  const total = organic.length + featured.length;
  const dataless = sort === 'menos-competencia' ? shown.findIndex((l) => l.rewardUsd == null || l.competitors == null || !isOpen(l, nowD)) : -1;
  const closingWeek = useMemo(() => sortListings(listings.filter((l) => { const d = effDeadline(l); return d && isOpen(l, nowD) && new Date(d).getTime() - nowD.getTime() < 7 * 864e5 && matches(l, { ...f, q: '' }, nowD); }), 'cierra-pronto', nowD).slice(0, 5), [listings, f, nowD]);
  const big = shown.length > 40;

  const set = (p: Partial<Filters>) => { setF((o) => ({ ...o, ...p })); setLimit(PAGE); };
  const toggleTipo = (t: ListingType) => set({ tipo: f.tipo === t ? null : t });
  const blur = !lowEnd;
  const item = {
    hidden: still ? { opacity: 1 } : { opacity: 0, y: 16, ...(blur ? { filter: 'blur(4px)' } : {}) },
    show: still ? { opacity: 1 } : { opacity: 1, y: 0, ...(blur ? { filter: 'blur(0px)' } : {}), transition: { duration: 0.24, ease } },
    exit: still ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.96, transition: { duration: 0.16 } },
  };

  const controls = (
    <div className="space-y-3">
      <label className="block">
        <span className="sr-only">Buscar</span>
        <input type="search" value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="🔍 Buscar…"
          className="min-h-tap w-full rounded-pill border border-border bg-surface-2 px-4 text-base text-fg placeholder:text-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-lime" />
      </label>
      <div className="chip-row -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Filtros">
        <Chip on={f.tipo === 'hackathon'} onClick={() => toggleTipo('hackathon')}>Hackathon</Chip>
        <Chip on={f.tipo === 'bounty'} onClick={() => toggleTipo('bounty')}>Bounty</Chip>
        <Chip on={f.tipo === 'grant'} onClick={() => toggleTipo('grant')}>Grant</Chip>
        <Chip on={f.irl} onClick={() => set({ irl: !f.irl })}>IRL</Chip>
        <Chip on={f.showClosed} onClick={() => set({ showClosed: !f.showClosed })}>Ver cerradas</Chip>
      </div>
    </div>
  );

  return (
    <LazyMotion features={domAnimation}>
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
        <aside className="hidden lg:block"><div className="sticky top-20"><p className="mb-3 font-mono text-xs uppercase tracking-[.08em] text-fg-muted">Filtros</p>{controls}</div></aside>
        <section aria-label="Oportunidades" className="min-w-0">
          <div className="lg:hidden">{controls}</div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 lg:mt-0">
            <p className="text-sm text-fg-muted"><Counter n={total} still={still} /></p>
            <div role="radiogroup" aria-label="Ordenar" className="chip-row -mx-4 flex max-w-full gap-1 overflow-x-auto px-4 text-sm sm:mx-0 sm:px-0">
              <span className="self-center pr-1 text-fg-muted">Ordenar:</span>
              <LayoutGroup id="sort">
                {SORTS.map((s) => (
                  <button key={s.id} role="radio" aria-checked={sort === s.id} onClick={() => setSort(s.id)}
                    className={`relative min-h-tap shrink-0 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime rounded ${sort === s.id ? 'text-lime' : 'text-fg-muted hover:text-fg'}`}>
                    {s.label}
                    {sort === s.id && <m.span layoutId="sort-indicator" className="absolute inset-x-2 bottom-1.5 h-0.5 rounded-pill bg-lime" transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }} />}
                  </button>
                ))}
              </LayoutGroup>
            </div>
          </div>
          {sort === 'menos-competencia' && (
            <p className="mt-1 text-xs text-fg-muted">Ordenado por premio por participante (estimado). <Link href="/acerca#ranking" className="text-lime underline-offset-4 hover:underline">¿Cómo se calcula?</Link></p>
          )}

          {featured.map((l) => (
            <m.div key={`f-${l.id}`} className="mt-4" initial={still ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, delay: 0.34, ease }}>
              <ListingCard listing={l} variant="featured" now={now} />
              <p className="mt-1 text-xs text-fg-muted"><Link href="/publicar" className="hover:text-fg">Espacio pago · ¿Qué es esto?</Link></p>
            </m.div>
          ))}

          {total === 0 ? <Empty f={f} set={set} /> : (
            <LayoutGroup>
              <m.ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" initial={still ? false : 'hidden'} animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.4 } } }}>
                <AnimatePresence mode="popLayout" initial={false}>
                  {shown.flatMap((l, i) => {
                    const out = [];
                    if (i === dataless && dataless > 0) out.push(<m.li layout={!big && !still} key="dataless" className="col-span-full pt-2 font-mono text-xs uppercase tracking-[.08em] text-fg-muted" exit={{ opacity: 0 }}>Sin datos de competencia</m.li>);
                    out.push(
                      <m.li key={l.id} layout={!big && !still ? 'position' : false} variants={i < 8 ? item : undefined}
                        initial={i < 8 ? undefined : still ? false : item.hidden} whileInView={i < 8 ? undefined : item.show} viewport={{ once: true, margin: '-10% 0px' }}
                        exit={item.exit} transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8, delay: Math.min(i, 12) * 0.015 }}
                        whileTap={still ? undefined : { scale: 0.98 }}>
                        <ListingCard listing={l} now={now} />
                      </m.li>,
                    );
                    if (i === 4) out.push(<li key="nl" className="col-span-full"><Newsletter variant="inline" /></li>);
                    if (i > 3 && (i + 1) % 10 === 0) out.push(<li key={`af-${i}`} className="col-span-full"><Affiliate /></li>);
                    return out;
                  })}
                </AnimatePresence>
              </m.ul>
              {organic.length > limit && (
                <div className="mt-6 text-center"><button onClick={() => setLimit((x) => x + PAGE)} className="min-h-tap rounded-pill border border-lime/60 px-6 text-lime hover:shadow-glow-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">Ver más</button></div>
              )}
            </LayoutGroup>
          )}
        </section>
        <aside className="space-y-4">
          <div className="hidden lg:block"><Newsletter variant="compact" /></div>
          {closingWeek.length > 0 && (
            <section className="rounded-card border border-border bg-surface p-4" aria-labelledby="cs">
              <h2 id="cs" className="font-medium">Cierran esta semana</h2>
              <ul className="mt-3 space-y-3">{closingWeek.map((l) => <li key={l.id}><ListingCard listing={l} variant="compact" now={now} /></li>)}</ul>
            </section>
          )}
          <Affiliate />
          <section className="rounded-card border border-border bg-surface p-4 text-sm text-fg-muted">
            <p><Link href="/acerca" className="text-fg hover:text-lime">Acerca de Condor Nest</Link></p>
            <p className="mt-1">Ulises, creador de Condor Nest, trabaja en belo. <Link href="/acerca#divulgacion" className="text-lime hover:underline">Ver divulgación →</Link></p>
          </section>
        </aside>
      </div>
    </LazyMotion>
  );
}

function Empty({ f, set }: { f: Filters; set: (p: Partial<Filters>) => void }) {
  const btn = 'mt-3 min-h-tap rounded-pill bg-lime px-5 font-medium text-primary-fg hover:shadow-glow-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bg';
  let msg = 'No hay oportunidades con estos filtros.'; let action = <button className={btn} onClick={() => set({ ...DEFAULT_FILTERS })}>Limpiar filtros</button>;
  if (f.q) { msg = `No encontramos “${f.q}”. Probá con otra palabra o ecosistema.`; action = <button className={btn} onClick={() => set({ q: '' })}>Borrar búsqueda</button>; }
  return <div className="mt-6 rounded-card border border-border bg-surface p-6 text-center"><p>{msg}</p>{action}</div>;
}
