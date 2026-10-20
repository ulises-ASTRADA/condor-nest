'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
type E = 'loading' | 'confirmado' | 'invalido' | 'error';
const key = (t: string) => `cn-nl-ok:${t.slice(0, 16)}`;
export default function AutoConfirm({ token }: { token: string }) {
  const [st, setSt] = useState<E>('loading'); const once = useRef(false);
  useEffect(() => {
    if (once.current) return; once.current = true;
    // Re-opening a link already confirmed in this browser shows success (token is single-use server-side).
    try { if (localStorage.getItem(key(token))) { setSt('confirmado'); return; } } catch {}
    fetch('/api/newsletter/confirm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }), cache: 'no-store' })
      .then((r) => r.json()).then((j) => { const e = (['confirmado', 'invalido', 'error'].includes(j?.estado) ? j.estado : 'error') as E;
        if (e === 'confirmado') { try { localStorage.setItem(key(token), '1'); } catch {} } setSt(e); })
      .catch(() => setSt('error'));
  }, [token]);
  const C = {
    loading: { t: 'Confirmando…', d: 'Un segundo.' },
    confirmado: { t: '¡Listo, ya estás suscripto!', d: 'El lunes te llega el primero.' },
    invalido: { t: 'Este link no funciona', d: 'Puede que haya vencido (dura 48 horas) o que ya lo hayas usado. Si ya confirmaste, no tenés que hacer nada; si no, suscribite de nuevo.' },
    error: { t: 'No pudimos procesarlo', d: 'Probá abrir el link de nuevo en un rato.' },
  }[st];
  return (<div aria-live="polite" data-state={st}>
    <h1 className="mt-3 font-display text-2xl font-semibold">{C.t}</h1>
    <p className="mt-3 text-fg-muted">{C.d}</p>
    {st !== 'loading' && <Link href="/" className="mt-7 inline-grid h-12 place-items-center rounded-[12px] bg-lime px-6 font-bold text-primary-fg">Ver oportunidades</Link>}
  </div>);
}
