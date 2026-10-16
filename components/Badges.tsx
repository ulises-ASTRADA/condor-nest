import type { Listing } from '@/lib/types';
import { ELIG_LABEL, TYPE_LABEL } from '@/lib/format';
const base = 'badge inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 font-mono text-xs uppercase tracking-[.08em]';
export function TypeBadge({ type }: { type: Listing['type'] }) {
  const c = type === 'hackathon' ? 'text-violet border-violet/50' : type === 'bounty' ? 'text-lime border-lime/50' : 'text-cyan border-cyan/50';
  return <span className={`${base} ${c}`}>{TYPE_LABEL[type]}</span>;
}
export function EligBadge({ l, short = false }: { l: Listing; short?: boolean }) {
  const ok = ['ar', 'latam', 'global'].includes(l.eligibility);
  const c = ok ? 'text-cyan border-cyan/50' : 'text-fg-muted border-border';
  const full = l.eligibility === 'restricted' && l.eligibilityNote ? `Restringido · ${l.eligibilityNote}` : l.eligibilityNote ? `${ELIG_LABEL[l.eligibility]} · ${l.eligibilityNote}` : ELIG_LABEL[l.eligibility];
  if (!short) return <span className={`${base} ${c} normal-case tracking-normal`}>{ok ? '✓ ' : ''}{l.eligibility === 'restricted' && l.eligibilityNote ? full : ELIG_LABEL[l.eligibility]}</span>;
  // Card: short label (DB eligibility_short, else a short note, else the generic label), one line with ellipsis; full text as tooltip.
  const label = l.eligibilityShort ?? (l.eligibility === 'restricted' && l.eligibilityNote && l.eligibilityNote.length <= 28 ? l.eligibilityNote : ELIG_LABEL[l.eligibility]);
  if (l.eligibility === 'unknown') return <>{l.eligibilityShort && <span title={full} className={`${base} ${c} min-w-0 max-w-full normal-case tracking-normal`}><span className="truncate">{l.eligibilityShort}</span></span>}<span title="Elegibilidad sin confirmar: revisá la fuente" className={`${base} border-border text-fg-muted normal-case tracking-normal`}>Sin confirmar</span></>;
  return <span title={full} className={`${base} ${c} min-w-0 max-w-full normal-case tracking-normal`}><span className="truncate">{ok ? '✓ ' : ''}{label}</span></span>;
}
export function ModalityBadge({ l }: { l: Listing }) {
  if (l.modality === 'online') return <span className={`${base} border-border text-fg-muted`}>Online</span>;
  return <span className={`${base} border-border text-fg-muted`}>{l.modality === 'irl' ? 'Presencial' : 'Híbrido'}{l.city ? ` · ${l.city}` : ''}</span>;
}
