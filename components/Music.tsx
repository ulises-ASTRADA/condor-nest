'use client';
import { useEffect, useRef, useState } from 'react';
// Lo-fi background music (basement.studio style). Track: "Condor Nest lo-fi" by Lo-Fi Mate (original, fully synthesized) — see public/audio/LICENSE.md.
// Never autoplays: audio starts only when the user clicks "Prender música". No AudioContext is created before that click.
// The audio file is only fetched on that first click.
const SRC = '/audio/condor-nest-lofi.mp3', VOL = 0.35, KEY = 'cn-music';

export function MusicToggle() {
  const [on, setOn] = useState(false);
  // Gapless loop: decode once into an AudioBuffer and loop an AudioBufferSourceNode (no <audio> loop seam).
  const r = useRef<{ ctx?: AudioContext; gain?: GainNode; buf?: Promise<AudioBuffer>; src?: AudioBufferSourceNode; t0?: number; off: number; t?: number }>({ off: 0 });
  const btn = useRef<HTMLButtonElement>(null);

  const ensure = () => {
    const s = r.current;
    if (!s.ctx) { s.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      s.gain = s.ctx.createGain(); s.gain.gain.value = 0; s.gain.connect(s.ctx.destination); }
    if (!s.buf) s.buf = fetch(SRC).then((x) => x.arrayBuffer()).then((ab) => s.ctx!.decodeAudioData(ab)); // fetched only on first start
    return s;
  };
  const ramp = (to: number, secs: number) => { const { ctx, gain } = r.current; if (!ctx || !gain) return; const n = ctx.currentTime;
    gain.gain.cancelScheduledValues(n); gain.gain.setValueAtTime(gain.gain.value, n); gain.gain.linearRampToValueAtTime(to, n + secs); };
  const halt = () => { const s = r.current; if (!s.src || !s.ctx) return; const buf = s.src.buffer!;
    s.off = (s.off + s.ctx.currentTime - (s.t0 ?? 0)) % buf.duration; try { s.src.stop(); } catch {} s.src.disconnect(); s.src = undefined; };
  const start = async () => {
    const s = ensure(); clearTimeout(s.t);
    try {
      await s.ctx!.resume(); if (s.ctx!.state !== 'running') return false;
      const buf = await s.buf!;
      if (!s.src) { const src = s.ctx!.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(s.gain!); src.start(0, s.off); s.src = src; s.t0 = s.ctx!.currentTime; }
      ramp(VOL, 2); setOn(true); return true;
    } catch { s.buf = undefined; return false; }
  };
  const stop = (temp = false) => { const s = r.current; if (!s.src) { if (!temp) setOn(false); return; } ramp(0, 1.5); if (!temp) setOn(false); clearTimeout(s.t); s.t = window.setTimeout(halt, 1600); };

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

  const flip = async () => { away.current = false; if (on) { stop(); localStorage.setItem(KEY, 'off'); } else if (await start()) localStorage.setItem(KEY, 'on'); };
  return (
    <button ref={btn} type="button" onClick={flip} aria-pressed={on} aria-label={on ? 'Apagar música' : 'Prender música'} title={on ? 'Apagar música' : 'Música lo-fi'}
      className="grid h-tap w-tap place-items-center rounded-pill text-fg-muted transition-colors duration-fast hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">
      <span aria-hidden="true" className={`eq flex h-4 items-end gap-[2px] ${on ? 'eq-on text-lime' : ''}`}>{[0, 1, 2, 3].map((i) => <i key={i} style={{ animationDelay: `${i * -0.23}s` }} />)}</span>
    </button>
  );
}
