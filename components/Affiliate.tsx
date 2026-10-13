import { safeHttpsUrl } from '@/lib/types';
// Affiliate slot (§3.7): Mercado Libre Argentina. URL comes from the AFFILIATE_URL env var (server-side);
// AFFILIATE_URL = Ulises's Mercado Libre affiliate link (meli.la → his ML social profile with Ledger picks).
export const AFFILIATE_FALLBACK = 'https://listado.mercadolibre.com.ar/hardware-wallet';
export function affiliateUrl() { return safeHttpsUrl(process.env.AFFILIATE_URL) ?? AFFILIATE_FALLBACK; }
export function Affiliate({ url }: { url: string }) {
  return (
    <aside className="fx-aff rounded-card border border-border bg-surface-2 px-4 py-3.5 text-sm" aria-label="Afiliado">
      <p className="font-mono text-[11px] uppercase leading-none tracking-[.08em] text-fg-muted">Afiliado</p>
      <a href={url} rel="sponsored noopener noreferrer" target="_blank" className="my-1.5 block text-fg underline-offset-4 hover:text-lime hover:underline" aria-label="Hardware wallets Ledger en Mercado Libre (abre sitio externo)">Hardware wallets Ledger → Mercado Libre ↗</a>
      <p className="text-xs text-fg-muted">Condor Nest recibe comisión. No cambia el precio.</p>
    </aside>
  );
}
