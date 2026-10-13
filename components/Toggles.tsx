'use client';
import { useEffect, useState } from 'react';
export function ThemeToggle() {
  const [light, setLight] = useState<boolean | null>(null);
  useEffect(() => setLight(document.documentElement.classList.contains('light')), []);
  const flip = () => { const v = !light; setLight(v); document.documentElement.classList.toggle('light', v); localStorage.setItem('cn-theme', v ? 'light' : 'dark'); };
  return (
    <button type="button" onClick={flip} aria-label={light ? 'Usar modo oscuro' : 'Usar modo claro'}
      className="grid h-tap w-tap place-items-center rounded-pill text-fg-muted transition-colors duration-fast hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">
      <span aria-hidden="true">{light ? '☾' : '☀'}</span>
    </button>
  );
}
export function useReduceMotionPref() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => setOn(document.documentElement.hasAttribute('data-reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches);
    read(); window.addEventListener('cn-motion', read); return () => window.removeEventListener('cn-motion', read);
  }, []);
  return on;
}
export function ReduceMotionToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(document.documentElement.hasAttribute('data-reduce-motion')), []);
  const flip = () => { const v = !on; setOn(v); document.documentElement.toggleAttribute('data-reduce-motion', v); localStorage.setItem('cn-reduce-motion', v ? '1' : '0'); window.dispatchEvent(new Event('cn-motion')); };
  return (
    <button type="button" role="switch" aria-checked={on} onClick={flip} className="inline-flex min-h-tap items-center gap-2 text-sm text-fg-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime rounded-pill px-2">
      <span className={`relative h-5 w-9 rounded-pill border border-border ${on ? 'bg-lime' : 'bg-surface-2'}`}><span className={`absolute top-0.5 h-3.5 w-3.5 rounded-pill bg-fg transition-transform duration-instant ${on ? 'translate-x-4' : 'translate-x-0.5'}`} /></span>
      Reducir animaciones
    </button>
  );
}
