'use client';
import { useEffect, useRef, useState } from 'react';
// Lo-fi background music (basement.studio style). Track: "Dimly lit" by iamoneabe, CC0 — see public/audio/LICENSE.md.
// Starts on load if the browser allows autoplay, otherwise on the first pointerdown/keydown/touchstart.
// If the user turned it off before (localStorage cn-music=off), it never auto-starts. Audio file is only fetched when playback starts.
const SRC = '/audio/dimly-lit.mp3', VOL = 0.35, KEY = 'cn-music';
const GESTURES = ['pointerdown', 'keydown', 'touchstart'] as const;

export function MusicToggle() {
  const [on, setOn] = useState(false);
  const r = useRef<{ ctx?: AudioContext; el?: HTMLAudioElement; gain?: GainNode; t?: number }>({});
  const btn = useRef<HTMLButtonElement>(null);

  const ensure = () => {
    const s = r.current;
    if (!s.ctx) s.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (!s.el) {
      s.el = new Audio(); s.el.src = SRC; s.el.loop = true; s.el.preload = 'auto';
      s.gain = s.ctx.createGain(); s.gain.gain.value = 0;
      s.ctx.createMediaElementSource(s.el).connect(s.gain).connect(s.ctx.destination);
    }
    return s as Required<typeof s>;
  };
  const ramp = (to: number, secs: number) => { const { ctx, gain } = r.current; if (!ctx || !gain) return; const n = ctx.currentTime;
    gain.gain.cancelScheduledValues(n); gain.gain.setValueAtTime(gain.gain.value, n); gain.gain.linearRampToValueAtTime(to, n + secs); };
  const start = async () => {
    const s = ensure(); clearTimeout(s.t);
    try { await s.ctx.resume(); await s.el.play(); ramp(VOL, 2); setOn(true); return true; } catch { return false; }
  };
  const stop = (temp = false) => { const s = r.current; if (!s.el) return; ramp(0, 1.5); if (!temp) setOn(false); clearTimeout(s.t); s.t = window.setTimeout(() => s.el?.pause(), 1600); };

  const onRef = useRef(false); onRef.current = on;
  const away = useRef(false);
  // Temporary pause when the tab is hidden or the window loses focus; resume on return. Never touches the saved preference.
  useEffect(() => {
    const hide = () => { if (onRef.current && !away.current) { away.current = true; stop(true); } };
    const back = () => { if (document.visibilityState === 'visible' && document.hasFocus() && away.current) { away.current = false; if (onRef.current) start(); } };
    const vis = () => (document.hidden ? hide() : back());
    document.addEventListener('visibilitychange', vis); window.addEventListener('blur', hide); window.addEventListener('focus', back);
    return () => { document.removeEventListener('visibilitychange', vis); window.removeEventListener('blur', hide); window.removeEventListener('focus', back); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (localStorage.getItem(KEY) === 'off') return;
    let done = false;
    const onGesture = (e: Event) => {
      if (done) return;
      if (btn.current && e.target instanceof Node && btn.current.contains(e.target)) return; // the toggle handles itself
      done = true; GESTURES.forEach((g) => window.removeEventListener(g, onGesture, true)); start();
    };
    GESTURES.forEach((g) => window.addEventListener(g, onGesture, { capture: true, passive: true }));
    // Try on load: only if autoplay is allowed (a fresh AudioContext starts 'running'); avoids fetching the file otherwise.
    const probe = new AudioContext();
    if (probe.state === 'running') { probe.close(); start().then((ok) => { if (ok) { done = true; GESTURES.forEach((g) => window.removeEventListener(g, onGesture, true)); } }); } else probe.close();
    return () => GESTURES.forEach((g) => window.removeEventListener(g, onGesture, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flip = async () => { away.current = false; if (on) { stop(); localStorage.setItem(KEY, 'off'); } else if (await start()) localStorage.setItem(KEY, 'on'); };
  return (
    <button ref={btn} type="button" onClick={flip} aria-pressed={on} aria-label={on ? 'Apagar música' : 'Prender música'} title={on ? 'Apagar música' : 'Música lo-fi'}
      className="grid h-tap w-tap place-items-center rounded-pill text-fg-muted transition-colors duration-fast hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">
      <span aria-hidden="true" className={`eq flex h-4 items-end gap-[2px] ${on ? 'eq-on text-lime' : ''}`}>{[0, 1, 2, 3].map((i) => <i key={i} style={{ animationDelay: `${i * -0.23}s` }} />)}</span>
    </button>
  );
}
