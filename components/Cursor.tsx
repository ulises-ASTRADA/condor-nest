'use client';
import { useEffect, useRef } from 'react';
// Custom cursor: a single lime dot (no trailing ring). Only on (pointer: fine) and when motion is allowed.
// Native cursor stays until the first move; pointer-events: none so it never blocks clicks.
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const html = document.documentElement;
    const fine = matchMedia('(pointer: fine)'), rm = matchMedia('(prefers-reduced-motion: reduce)');
    const allowed = () => fine.matches && !rm.matches && !html.hasAttribute('data-reduce-motion');
    let x = -100, y = -100, raf = 0, on = false;
    const paint = () => { raf = 0; if (dot.current) dot.current.style.transform = `translate3d(${x}px,${y}px,0)`; };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !allowed()) { if (on) { html.classList.remove('cursor-on'); on = false; } return; }
      x = e.clientX; y = e.clientY; if (!on) { html.classList.add('cursor-on'); on = true; }
      const t = e.target as Element;
      const text = !!t.closest?.('input:not([type=checkbox]):not([type=radio]), textarea, [contenteditable="true"]');
      const hot = !text && !!t.closest?.('a, button, select, label, [role="checkbox"], [role="switch"], summary');
      dot.current?.classList.toggle('hot', hot); dot.current?.classList.toggle('text', text);
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const leave = () => { html.classList.remove('cursor-on'); on = false; };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('mouseleave', leave);
    return () => { window.removeEventListener('pointermove', move); document.removeEventListener('mouseleave', leave); cancelAnimationFrame(raf); html.classList.remove('cursor-on'); };
  }, []);
  return <div ref={dot} aria-hidden="true" className="cn-cursor dot" />;
}
