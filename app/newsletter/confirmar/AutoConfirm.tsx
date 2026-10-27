'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Newsletter } from '@/components/Newsletter';
import { PRIMARY, SECONDARY } from './styles';
type E = 'loading' | 'confirmado' | 'invalido' | 'error';
const key = (t: string) => `cn-nl-ok:${t.slice(0, 16)}`;
// The token is single-use: cn_confirm clears it on success, so a second open can't tell "already used" from "expired".
// Re-opening in the same browser shows success via localStorage; elsewhere it shows the expired state with the form.
export default function AutoConfirm({ token }: { token: string }) {
  const [st, setSt] = useState<E>('loading'); const once = useRef(false);
  const run = useCallback(() => {
    setSt('loading');
    // Allow the confirmation and transactional welcome delivery to finish.
    fetch('/api/newsletter/confirm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }), cache: 'no-store', signal: AbortSignal.timeout(30_000) })
      .then((r) => r.json()).then((j) => { const e = (['confirmado', 'invalido', 'error'].includes(j?.estado) ? j.estado : 'error') as E;
        if (e === 'confirmado') { try { localStorage.setItem(key(token), '1'); } catch {} } setSt(e); })
      .catch(() => setSt('error'));
  }, [token]);
  useEffect(() => {
    if (once.current) return; once.current = true;
    try { if (localStorage.getItem(key(token))) { setSt('confirmado'); return; } } catch {}
    run();
  }, [token, run]);
  const C = {
    loading: { t: 'Confirmando…', d: 'Un segundo.' },
    confirmado: { t: '¡Listo, ya estás suscripto!', d: 'Te escribimos cuando haya oportunidades nuevas.' },
    invalido: { t: 'Este link ya venció', d: 'Poné tu mail y te mandamos uno nuevo. Si ya lo habías confirmado, no tenés que hacer nada.' },
    error: { t: 'No pudimos procesarlo', d: 'Puede ser la conexión. Probá de nuevo.' },
  }[st];
  return (<>
    <div aria-live="polite" data-state={st}>
      <h1 className="mt-3 font-display text-2xl font-semibold">{C.t}</h1>
      <p className="mt-3 text-fg-muted">{C.d}</p>
    </div>
    {st === 'invalido' && <Newsletter variant="resub" />}
    {st === 'error' && <div><button type="button" onClick={run} className={PRIMARY}>Reintentar</button></div>}
    {st !== 'loading' && <Link href="/" className={st === 'confirmado' ? PRIMARY : SECONDARY}>Ver oportunidades</Link>}
  </>);
}
