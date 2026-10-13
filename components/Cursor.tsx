'use client';
import { useEffect, useRef } from 'react';
// Futuristic cursor: lime dot + trailing ring. Only on (pointer: fine) and when motion is allowed.
// Native cursor stays until the first move; pointer-events: none so it never blocks clicks.
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null); const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const html = document.documentElement;
    const fine = matchMedia('(pointer: fine)'), rm = matchMedia('(prefers-reduced-motion: reduce)');
    const allowed = () => fine.matches && !rm.matches && !html.hasAttribute('data-reduce-motion');
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0, on = false;
    const loop = () => { rx += (x - rx) * 0.2; ry += (y - ry) * 0.2;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.1 ? requestAnimationFrame(loop) : 0; };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !allowed()) { if (on) { html.classList.remove('cursor-on'); on = false; } return; }
      x = e.clientX; y = e.clientY; if (!on) { rx = x; ry = y; html.classList.add('cursor-on'); on = true; }
      const t = e.target as Element;
      const text = !!t.closest?.('input:not([type=checkbox]):not([type=radio]), textarea, [contenteditable="true"]');
      const hot = !text && !!t.closest?.('a, button, select, label, [role="checkbox"], [role="switch"], summary');
      ring.current?.classList.toggle('hot', hot); ring.current?.classList.toggle('text', text); dot.current?.classList.toggle('text', text);
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const leave = () => { html.classList.remove('cursor-on'); on = false; };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('mouseleave', leave);
    return () => { window.removeEventListener('pointermove', move); document.removeEventListener('mouseleave', leave); cancelAnimationFrame(raf); html.classList.remove('cursor-on'); };
  }, []);
  return <><div ref={ring} aria-hidden="true" className="cn-cursor ring" /><div ref={dot} aria-hidden="true" className="cn-cursor dot" /></>;
}
