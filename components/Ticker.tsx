'use client';
import { useEffect, useRef } from 'react';
/** Text that animates only the digits that changed since the last render (CSS .cn-digit[data-changed]); never on first paint. */
export function Ticker({ text }: { text: string }) {
  const prev = useRef<string | null>(null);
  const p = prev.current;
  useEffect(() => { prev.current = text; }, [text]);
  if (p === null || p.length !== text.length || p === text) return <>{text}</>;
  const out: React.ReactNode[] = []; let buf = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/\d/.test(ch) && ch !== p[i]) { if (buf) { out.push(buf); buf = ''; } out.push(<span key={`${i}:${ch}`} className="cn-digit" data-changed="">{ch}</span>); }
    else buf += ch;
  }
  if (buf) out.push(buf);
  return <>{out}</>;
}
