'use client';
import { useState } from 'react';
export function ShareButton({ title }: { title: string }) {
  const [toast, setToast] = useState(false);
  async function share() {
    const url = location.href;
    if (navigator.share) { try { await navigator.share({ title, url }); return; } catch { return; } }
    await navigator.clipboard.writeText(url); setToast(true); setTimeout(() => setToast(false), 2500);
  }
  return (
    <>
      <button onClick={share} className="min-h-tap rounded-pill px-3 text-sm text-fg-muted hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">Compartir</button>
      {toast && <div role="status" className="cn-toast fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill border border-lime/60 bg-surface px-4 py-2 text-sm shadow-glow-lime">¡Link copiado!</div>}
    </>
  );
}
export function CountdownShell({ children }: { children: React.ReactNode }) { return <>{children}</>; }
