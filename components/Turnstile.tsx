'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
const KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
type TS = { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id: string) => void; remove: (id: string) => void };
declare global { interface Window { turnstile?: TS; cnTsLoad?: Promise<void> } }
function load(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!window.cnTsLoad) window.cnTsLoad = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.defer = true;
    s.onload = () => res(); s.onerror = () => rej(); document.head.appendChild(s);
  });
  return window.cnTsLoad;
}
export type TurnstileHandle = { token: () => Promise<string | undefined>; reset: () => void };
/** Unobtrusive Turnstile: invisible unless Cloudflare needs an interaction ('interaction-only'). Renders nothing without a site key. */
export const Turnstile = forwardRef<TurnstileHandle>(function Turnstile(_, ref) {
  const el = useRef<HTMLDivElement>(null); const id = useRef<string | null>(null); const tok = useRef<string | undefined>(undefined);
  useImperativeHandle(ref, () => ({
    // Waits up to 6 s for Cloudflare's (usually invisible) check to finish.
    token: async () => { for (let i = 0; KEY && !tok.current && i < 30; i++) await new Promise((r) => setTimeout(r, 200)); return tok.current; }, reset: () => { tok.current = undefined; if (id.current && window.turnstile) window.turnstile.reset(id.current); } }), []);
  useEffect(() => {
    if (!KEY) return; let gone = false;
    load().then(() => {
      if (gone || !el.current || !window.turnstile) return;
      id.current = window.turnstile.render(el.current, { sitekey: KEY, appearance: 'interaction-only', size: 'flexible', theme: 'dark', language: 'es', callback: (t: string) => { tok.current = t; }, 'expired-callback': () => { tok.current = undefined; }, 'error-callback': () => { tok.current = undefined; } });
    }).catch(() => {});
    return () => { gone = true; if (id.current && window.turnstile) window.turnstile.remove(id.current); };
  }, []);
  return KEY ? <div ref={el} className="cf-ts mt-2 w-full max-w-full overflow-hidden empty:mt-0" /> : null;
});
