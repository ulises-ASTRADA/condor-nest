import type { Listing } from '@/lib/types';
import { ELIG_LABEL, TYPE_LABEL } from '@/lib/format';
import { access, ACCESS_LABEL } from '@/lib/rank';
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
/** 'Virtual' (online), 'Presencial · city', 'Híbrido · city' — same wording on cards and the detail page. */
export const modalityLabel = (l: Listing) => (l.modality === 'online' ? 'Virtual' : `${l.modality === 'irl' ? 'Presencial' : 'Híbrido'}${l.city ? ` · ${l.city}` : ''}`);
export function ModalityBadge({ l }: { l: Listing }) {
  return <span className={`${base} border-border text-fg-muted`}>{modalityLabel(l)}</span>;
}
/** Card tags under the date: modality, then access. 24px, 12px text, wrap (never truncate); only 'Abierto a todos' in lime. */
const tag = 'inline-flex min-h-6 items-center rounded-pill border px-2 py-1 text-xs leading-4';
export function CardTags({ l }: { l: Listing }) {
  const a = access(l);
  const tone = a === 'todos' ? 'border-border text-lime' : a === 'requisitos' ? 'border-border text-fg' : 'border-dashed border-fg-muted/60 text-fg-muted';
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className={`${tag} border-border text-fg`}>{modalityLabel(l)}</span>
      <span className={`${tag} ${tone}`} title={a === 'confirmar' ? 'La fuente no aclara quién puede participar' : undefined}>{ACCESS_LABEL[a]}</span>
    </div>
  );
}
