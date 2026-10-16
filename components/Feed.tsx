'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Listing, ListingType } from '@/lib/types';
import { filtersFromSearch, ALL_TYPES, DEFAULT_FILTERS, SORTS, type Modality, filtersToSearch, matches, sortListings, isOpen, effDeadline, type Filters, type Sort } from '@/lib/rank';
import dynamic from 'next/dynamic';
const Newsletter = dynamic(() => import('./Newsletter').then((x) => x.Newsletter));
import { Affiliate } from './Affiliate';
import { Ticker } from './Ticker';
import { useReduceMotionPref } from './Toggles';
import { ECOSYSTEMS, type Eco } from '@/lib/eco';
import { COUNTRY_ES } from '@/lib/geo';
import { inCountry } from '@/lib/rank';

const TYPE_LBL: Record<ListingType, string> = { hackathon: 'Hackathon', bounty: 'Bounty', grant: 'Grant' };
const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function Check({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} onClick={onClick} className="fx-check flex min-h-9 w-full items-center gap-2 rounded py-1.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">
      <span aria-hidden="true" data-off={on ? undefined : ''} className={`grid h-[18px] w-[18px] place-items-center rounded-[5px] text-xs transition-[background-color,box-shadow] duration-instant ${on ? 'bg-lime text-bg shadow-[0_0_12px_-2px_rgb(var(--lime)/.7)]' : 'border border-border'}`}>{on ? '✓' : ''}</span>
      {children}
    </button>
  );
}
const H4 = ({ children }: { children: React.ReactNode }) => <h4 className="mb-2.5 mt-5 font-mono text-[11px] uppercase leading-none tracking-[.08em] text-fg-muted">{children}</h4>;

const PAGE = 20;

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className="group relative flex min-h-tap shrink-0 items-center focus-visible:outline-none">
      <span className={`inline-flex h-9 items-center rounded-pill border px-3 text-sm transition-[background-color,color,box-shadow] duration-instant group-focus-visible:ring-2 group-focus-visible:ring-lime ${on ? 'border-lime bg-lime text-primary-fg shadow-glow-lime' : 'border-border bg-surface-2 text-fg hover:border-lime/60'}`}>{children}</span>
    </button>
  );
}

function Counter({ n }: { n: number }) {
  return <span aria-live="polite" className="font-mono tabular"><Ticker text={n.toLocaleString('es-AR')} /> {n === 1 ? 'oportunidad' : 'oportunidades'}</span>;
}

export function Feed({ listings, now, initial, affUrl, hero, cards, featuredCards }: { listings: Listing[]; now: string; initial: { f: Filters; sort: Sort }; affUrl: string; hero?: React.ReactNode; cards: React.ReactNode; featuredCards: React.ReactNode }) {
  // Scope lives only in the URL (no hidden geo/localStorage scope): default = all LatAm (listings restricted to another country are always hidden).
  const [f, setF] = useState<Filters>(initial.f);
  const choosePais = (iso: string | null) => { setF((o) => ({ ...o, pais: iso })); setLimit(PAGE); };
  const paises = useMemo(() => Object.keys(COUNTRY_ES).filter((c) => listings.some((l) => inCountry(l, c))).sort((a, b) => COUNTRY_ES[a].localeCompare(COUNTRY_ES[b], 'es')), [listings]);
  const paisSelect = (cls: string) => (
    <label className={cls}><span className="sr-only">País</span>
      <select value={f.pais ?? ''} onChange={(e) => choosePais(e.target.value || null)} className="fx-input h-9 w-full cursor-pointer rounded-[10px] border border-border bg-surface-2 px-2.5 text-sm text-fg">
        <option value="">Toda LatAm</option>
        {[...new Set([...(f.pais ? [f.pais] : []), ...paises])].map((c) => <option key={c} value={c}>{COUNTRY_ES[c] ?? c}</option>)}
      </select>
    </label>
  );
  const [sort, setSort] = useState<Sort>(initial.sort);
  const [limit, setLimit] = useState(PAGE);
  const first = useRef(true);
  // URL → state: logo/breadcrumb Link to "/", back/forward, or any external URL change resets the island to what the URL says.
  const sp = useSearchParams(); const spStr = sp.toString();
  const lastQs = useRef<string | null>(null);
  const prevF = useRef<{ f: Filters; sort: Sort } | null>(null); const lastQAt = useRef(0);
  useEffect(() => {
    if (lastQs.current === null) { lastQs.current = spStr; return; }
    if (spStr === lastQs.current) return;
    lastQs.current = spStr;
    const next = filtersFromSearch(Object.fromEntries(sp.entries()));
    setF(next.f); setSort(next.sort); setLimit(PAGE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spStr]);
  const nowD = useMemo(() => new Date(now), [now]);
  const [tick, setTick] = useState(() => new Date(now).getTime());
  useEffect(() => { setTick(Date.now()); const t = setInterval(() => setTick(Date.now()), 30000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (first.current) { first.current = false; prevF.current = { f, sort }; return; }
    const el = document.getElementById('feed-list');
    if (el && !document.documentElement.hasAttribute('data-reduce-motion') && !matchMedia('(prefers-reduced-motion: reduce)').matches) el.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
    const qs = filtersToSearch(f, sort);
    const prev = prevF.current; prevF.current = { f, sort };
    if (qs === lastQs.current) return; // URL already says this (back/forward, logo)
    lastQs.current = qs;
    // Discrete changes (país, chips, toggles, sort) push a history entry so Back undoes them one by one.
    // Typing in search: first keystroke pushes, the rest of the burst replaces (one entry per search).
    const onlyQ = prev && prev.sort === sort && JSON.stringify({ ...prev.f, q: '' }) === JSON.stringify({ ...f, q: '' });
    const now2 = Date.now(); const typing = onlyQ && now2 - lastQAt.current < 1200; if (onlyQ) lastQAt.current = now2;
    window.history[typing ? 'replaceState' : 'pushState'](null, '', qs ? `/?${qs}` : '/');
  }, [f, sort]);

  const featured = useMemo(() => listings.filter((l) => l.featured && matches(l, f, nowD)).slice(0, 1), [listings, f, nowD]);
  const organic = useMemo(() => sortListings(listings.filter((l) => !l.featured && matches(l, f, nowD)), sort, nowD), [listings, f, sort, nowD]);
  const shown = organic.slice(0, limit);
  const total = organic.length + featured.length;
  const dataless = sort === 'menos-competencia' ? shown.findIndex((l) => l.rewardUsd == null || l.competitors == null || !isOpen(l, nowD)) : -1;
  const vis = useMemo(() => listings.filter((l) => matches(l, f, nowD)), [listings, f, nowD]);
  const closingWeek = useMemo(() => sortListings(listings.filter((l) => { const d = effDeadline(l); return d && isOpen(l, nowD) && new Date(d).getTime() - nowD.getTime() < 7 * 864e5 && matches(l, { ...f, q: '' }, nowD); }), 'cierra-pronto', nowD).slice(0, 5), [listings, f, nowD]);
  // Cards are server-rendered (Server Component) in #feed-list; this island only decides which show and in what order.
  const css = useMemo(() => {
    const esc = (v: string) => v.replace(/["\\]/g, '\\$&');
    const r: string[] = [];
    featured.forEach((l) => r.push(`#feed-featured>[data-id="${esc(l.id)}"]{display:block}`));
    shown.forEach((l, i) => r.push(`#feed-list>[data-id="${esc(l.id)}"]{display:flex;order:${i * 2 + 2}${i < 6 ? `;--cn-anim:cn-in;--cn-d:${(i + 1) * 40}ms` : ''}}`));
    if (dataless > 0) r.push(`#feed-list>[data-id="dataless"]{display:block;order:${dataless * 2 + 1}}`);
    const unc = shown.findIndex((l) => l.eligibility === 'unknown');
    if (unc >= 0) r.push(`#feed-list>[data-id="unconf"]{display:block;order:${unc * 2 + 1}}`);
    if (shown.length >= 10) r.push(`@media (max-width:1023.98px){#feed-list>[data-id="af"]{display:block;order:21}}`);
    return r.join('');
  }, [featured, shown, dataless]);

  const set = (p: Partial<Filters>) => { setF((o) => ({ ...o, ...p })); setLimit(PAGE); };
  // mobile chips: a type chip shows "only this type"; tapping again restores all
  const chipTipo = (t: ListingType) => set({ tipos: f.tipos.length === 1 && f.tipos[0] === t ? [...ALL_TYPES] : [t] });
  const onlyTipo = (t: ListingType) => f.tipos.length === 1 && f.tipos[0] === t;
  const search = (
    <label className="block">
      <span className="sr-only">Buscar</span>
      <input type="search" value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="⌕  Buscar hackathons, bounties, grants…"
        className="fx-input h-12 w-full rounded-[12px] border border-border bg-surface-2 px-3.5 text-base text-fg placeholder:text-fg-muted" />
    </label>
  );
  const mobileControls = (
    <div className="mt-3">
      {paisSelect('mb-2 block')}
      <div className="chip-row -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Filtros">
        <Chip on={!f.sinConfirmar} onClick={() => set({ sinConfirmar: !f.sinConfirmar })}>Ocultar sin confirmar</Chip>
        {ALL_TYPES.map((t) => <Chip key={t} on={onlyTipo(t)} onClick={() => chipTipo(t)}>{TYPE_LBL[t]}</Chip>)}
        {(['online', 'irl'] as Modality[]).map((m) => <Chip key={m} on={f.modalidades.includes(m)} onClick={() => set({ modalidades: toggle(f.modalidades, m) })}>{m === 'irl' ? 'Presencial' : 'Online'}</Chip>)}
        {ECOSYSTEMS.map((e) => <Chip key={e} on={f.ecos.includes(e)} onClick={() => set({ ecos: toggle(f.ecos, e as Eco) })}>{e}</Chip>)}
        <Chip on={f.showClosed} onClick={() => set({ showClosed: !f.showClosed })}>Ver cerradas</Chip>
      </div>
    </div>
  );
  const sideControls = (
    <div className="text-sm">
      <H4>País</H4>
      {paisSelect('block')}
      <H4>Tipo</H4>
      {ALL_TYPES.map((t) => <Check key={t} on={f.tipos.includes(t)} onClick={() => set({ tipos: toggle(f.tipos, t) })}>{TYPE_LBL[t]}</Check>)}
      <H4>Modalidad</H4>
      {(['online', 'irl'] as Modality[]).map((m) => <Check key={m} on={f.modalidades.includes(m)} onClick={() => set({ modalidades: toggle(f.modalidades, m) })}>{m === 'irl' ? 'Presencial' : 'Online'}</Check>)}
      <H4>Ecosistema</H4>
      {ECOSYSTEMS.map((e) => <Check key={e} on={f.ecos.includes(e)} onClick={() => set({ ecos: toggle(f.ecos, e as Eco) })}>{e}</Check>)}
      <H4>Estado</H4>
      <Check on={f.showClosed} onClick={() => set({ showClosed: !f.showClosed })}>Ver cerradas</Check>
      <Check on={!f.sinConfirmar} onClick={() => set({ sinConfirmar: !f.sinConfirmar })}>Ocultar sin confirmar</Check>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="grid gap-6 pt-5 lg:grid-cols-[240px_minmax(0,1fr)_300px] lg:gap-8 lg:pt-8">
        <aside className="hidden lg:block" aria-label="Filtros"><div className="sticky top-[90px]">{sideControls}</div></aside>
        <section aria-label="Oportunidades" className="min-w-0">
          {hero}
          <div className="mt-4">{search}</div>
          {f.pais && (
            <div role="status" className="mt-3 inline-flex max-w-full items-center gap-2 rounded-pill border border-cyan/40 bg-surface-2 py-1 pl-3 pr-1 text-sm">
              <span>📍 Mostrando oportunidades para {COUNTRY_ES[f.pais] ?? f.pais}</span><span aria-hidden="true" className="text-fg-muted">·</span>
              <button type="button" onClick={() => choosePais(null)} className="text-cyan underline-offset-4 hover:underline">Ver todo LatAm</button>
              <button type="button" aria-label="Quitar filtro de país" onClick={() => choosePais(null)} className="grid h-7 w-7 place-items-center rounded-pill text-fg-muted hover:text-fg">✕</button>
            </div>
          )}
          <div className="lg:hidden">{mobileControls}</div>
          <div className="mt-3.5 flex items-center justify-between gap-2 text-sm">
            <p className="text-sm text-fg-muted"><Counter n={total} /></p>
            <label className="fx-sort relative flex items-center gap-1.5 rounded-[10px] border border-lime/50 px-2.5 py-1.5 text-lime focus-within:ring-2 focus-within:ring-lime">
              <span aria-hidden="true">⇅</span><span className="sr-only">Ordenar</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="min-h-[28px] cursor-pointer appearance-none bg-transparent pr-4 text-lime focus:outline-none">
                {SORTS.map((s) => <option key={s.id} value={s.id} className="bg-surface text-fg">{s.label}</option>)}
              </select>
              <span aria-hidden="true" className="pointer-events-none absolute right-2.5">▾</span>
            </label>
          </div>
          {sort === 'menos-competencia' && (
            <p className="mt-1.5 text-xs text-fg-muted">Ordenado por premio por participante (estimado). <Link href="/acerca#ranking" prefetch={false} className="text-cyan underline decoration-cyan/50 underline-offset-4 hover:underline">¿Cómo se calcula?</Link></p>
          )}

          <div id="feed-featured">{featuredCards}</div>

          {total === 0 ? <Empty f={f} set={set} unconf={!f.sinConfirmar ? listings.filter((l) => matches(l, { ...f, sinConfirmar: true }, nowD)).length : 0} /> : null}
          <ul id="feed-list" className={`mt-4 grid items-stretch gap-3 sm:grid-cols-2 ${total === 0 ? 'hidden' : ''}`}>{cards}</ul>
          {total > 0 && shown.length < 10 && <div className="mt-3 lg:hidden"><Affiliate url={affUrl} /></div>}
          {organic.length > limit && (
            <div className="mt-6 text-center"><button onClick={() => setLimit((x) => x + PAGE)} className="min-h-tap rounded-pill border border-lime/60 px-6 text-lime hover:shadow-glow-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">Ver más</button></div>
          )}
        </section>
        <aside className="hidden flex-col gap-4 lg:flex lg:sticky lg:top-[90px] lg:self-start">
          <Newsletter variant="compact" />
          {closingWeek.length > 0 && (
            <section aria-labelledby="cs">
              <h4 id="cs" className="mb-0.5 font-mono text-[11px] uppercase leading-none tracking-[.08em] text-fg-muted">Próximas fechas</h4>
              <ul>{closingWeek.map((l) => { const ms = new Date(effDeadline(l)!).getTime() - tick; return (
                <li key={l.id} className="fx-mini border-b border-border py-2.5 text-sm">
                  <Link href={`/o/${l.slug}`} prefetch={false} className="hover:text-lime" lang={l.titleLang}>{l.title}</Link>
                  <div className={`font-mono text-xs ${ms < 864e5 ? 'font-bold text-danger' : 'text-warning'}`}>{ms <= 0 ? (l.deadlineAt ? 'cerrada' : 'empezó') : `${l.deadlineAt ? 'Cierra' : 'Empieza'} en ${rel(ms)}`}</div>
                </li>); })}</ul>
            </section>
          )}
          <Affiliate url={affUrl} />
        </aside>
      </div>
    </>
  );
}

function Empty({ f, set, unconf }: { f: Filters; set: (p: Partial<Filters>) => void; unconf: number }) {
  const btn = 'mt-3 min-h-tap rounded-pill bg-lime px-5 font-medium text-primary-fg hover:shadow-glow-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bg';
  let msg = 'No hay oportunidades con estos filtros.'; let action = <button className={btn} onClick={() => set({ ...DEFAULT_FILTERS, tipos: [...ALL_TYPES] })}>Limpiar filtros</button>;
  if (unconf > 0) { msg = `Hay ${unconf} ${unconf === 1 ? 'resultado' : 'resultados'} con estos filtros, pero con elegibilidad sin confirmar.`; action = <button className={btn} onClick={() => set({ sinConfirmar: true })}>Mostrar sin confirmar</button>; }
  else if (f.q) { msg = `No encontramos “${f.q}”. Probá con otra palabra o ecosistema.`; action = <button className={btn} onClick={() => set({ q: '' })}>Borrar búsqueda</button>; }
  return <div className="mt-6 rounded-card border border-border bg-surface p-6 text-center"><p>{msg}</p>{action}</div>;
}

function rel(ms: number) {
  const m = Math.floor(ms / 6e4), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  return d > 0 ? `${d} d ${h} h` : h > 0 ? `${h} h ${mm} min` : `${mm} min`;
}
