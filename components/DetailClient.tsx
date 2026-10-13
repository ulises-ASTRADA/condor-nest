'use client';
import { useState } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'motion/react';
export function ShareButton({ title }: { title: string }) {
  const [toast, setToast] = useState(false);
  async function share() {
    const url = location.href;
    if (navigator.share) { try { await navigator.share({ title, url }); return; } catch { return; } }
    await navigator.clipboard.writeText(url); setToast(true); setTimeout(() => setToast(false), 2500);
  }
  return (
    <LazyMotion features={domAnimation}>
      <button onClick={share} className="min-h-tap rounded-pill px-3 text-sm text-fg-muted hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">Compartir</button>
      <AnimatePresence>{toast && (
        <m.div role="status" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0, transition: { duration: 0.15 } }} transition={{ duration: 0.24 }}
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill border border-lime/60 bg-surface px-4 py-2 text-sm shadow-glow-lime">¡Link copiado!</m.div>
      )}</AnimatePresence>
    </LazyMotion>
  );
}
export function CountdownShell({ children }: { children: React.ReactNode }) { return <LazyMotion features={domAnimation}>{children}</LazyMotion>; }
