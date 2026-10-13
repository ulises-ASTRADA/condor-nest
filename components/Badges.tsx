import type { Listing } from '@/lib/types';
import { ELIG_LABEL, TYPE_LABEL } from '@/lib/format';
const base = 'inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 font-mono text-xs uppercase tracking-[.08em]';
export function TypeBadge({ type }: { type: Listing['type'] }) {
  const c = type === 'hackathon' ? 'text-violet border-violet/50' : type === 'bounty' ? 'text-lime border-lime/50' : 'text-cyan border-cyan/50';
  return <span className={`${base} ${c}`}>{TYPE_LABEL[type]}</span>;
}
export function EligBadge({ l }: { l: Listing }) {
  const ok = ['ar', 'latam', 'global'].includes(l.eligibility);
  const c = ok ? 'text-cyan border-cyan/50' : 'text-fg-muted border-border';
  const label = l.eligibility === 'restricted' && l.eligibilityNote ? `Restringido · ${l.eligibilityNote}` : ELIG_LABEL[l.eligibility];
  return <span className={`${base} ${c} normal-case tracking-normal`}>{ok ? '✓ ' : ''}{label}</span>;
}
export function ModalityBadge({ l }: { l: Listing }) {
  if (l.modality === 'online') return <span className={`${base} border-border text-fg-muted`}>Online</span>;
  return <span className={`${base} border-border text-fg-muted`}>{l.modality === 'irl' ? 'IRL' : 'Híbrido'}{l.city ? ` · ${l.city}` : ''}</span>;
}
