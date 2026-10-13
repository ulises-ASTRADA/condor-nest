/** Geometric condor seen from below (wings = two chevrons, head/tail) over a hexagonal nest of 3 stacked arcs. */
export function CondorMark({ size = 28, nest = true, className = '' }: { size?: number; nest?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* wings: two chevrons spanning out from the body */}
      <path d="M16 9 L9 6.5 L2 10 L9 9.5 Z" />
      <path d="M16 9 L23 6.5 L30 10 L23 9.5 Z" />
      {/* body + head + fanned tail */}
      <path d="M16 6.5 V13.5 M14.6 13.5 L16 16 L17.4 13.5" />
      <circle cx="16" cy="5.2" r="1.1" />
      {nest && (<>
        <path d="M8.5 21 L12 18.5 H20 L23.5 21 L20 23.5 H12 Z" />
        <path d="M7 24.5 Q16 30.5 25 24.5" />
        <path d="M9.5 27.5 Q16 31.5 22.5 27.5" />
      </>)}
    </svg>
  );
}
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-lime">
      <CondorMark size={28} className="drop-shadow-[0_0_6px_rgb(var(--lime)/.45)]" />
      <span className={`font-display font-extrabold uppercase tracking-[.04em] text-sm max-[359px]:hidden ${compact ? 'sr-only' : ''}`}>
        <span className="text-fg">CONDOR</span> <span className="text-gradient">NEST</span>
      </span>
    </span>
  );
}
