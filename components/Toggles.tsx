'use client';
import { useEffect, useState } from 'react';
export function ThemeToggle() {
  const [light, setLight] = useState<boolean | null>(null);
  useEffect(() => setLight(document.documentElement.classList.contains('light')), []);
  const flip = () => { const v = !light; setLight(v); document.documentElement.classList.toggle('light', v); localStorage.setItem('cn-theme', v ? 'light' : 'dark'); };
  return (
    <button type="button" onClick={flip} aria-label={light ? 'Usar modo oscuro' : 'Usar modo claro'}
      className="fx-rotate grid h-tap w-tap place-items-center rounded-pill text-fg-muted transition-colors duration-fast hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">
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
    <button type="button" role="switch" aria-checked={on} onClick={flip} className="inline-flex min-h-tap items-center gap-3 text-sm text-fg-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime rounded-pill px-2">
      <SwitchTrack on={on} />
      Reducir animaciones
    </button>
  );
}

/** Shared switch visual. Track 40×22, knob 16, padding 3 → travel = 40 − 16 − 2·3 = 18px. */
export function SwitchTrack({ on }: { on: boolean }) {
  return (
    <span aria-hidden="true" style={{ width: 40, height: 22 }}
      className={`relative inline-block shrink-0 rounded-pill ring-1 ring-inset transition-colors duration-200 ease-out ${on ? 'bg-lime ring-lime' : 'bg-surface-2 ring-border'}`}>
      <span style={{ width: 16, height: 16, top: 3, left: 3, transform: `translateX(${on ? 18 : 0}px)`, transition: 'transform 200ms cubic-bezier(.16,1,.3,1), background-color 200ms' }}
        className={`absolute rounded-pill shadow-sm ${on ? 'bg-[#07080B]' : 'bg-fg'}`} />
    </span>
  );
}
