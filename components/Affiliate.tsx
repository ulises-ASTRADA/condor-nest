// Affiliate slot (§3.7). Renders only when a real affiliate URL is configured; no example data is shipped.
export function Affiliate() {
  const url = process.env.NEXT_PUBLIC_LEDGER_AFFILIATE_URL;
  if (!url) return null;
  return (
    <aside className="rounded-card bg-surface-2 p-4 text-sm" aria-label="Afiliado">
      <p className="font-mono text-xs uppercase tracking-[.08em] text-fg-muted">Afiliado</p>
      <a href={url} rel="sponsored noopener" target="_blank" className="mt-1 block font-medium text-fg underline-offset-4 hover:underline" aria-label="Guardá tus premios en una hardware wallet: Ledger (abre sitio externo)">Guardá tus premios en una hardware wallet → Ledger ↗</a>
      <p className="mt-1 text-fg-muted">Si comprás con este link, Condor Nest recibe una comisión. No cambia el precio.</p>
    </aside>
  );
}
