'use client';
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-card border border-border bg-surface p-6 text-center" role="alert">
      <p>No pudimos cargar las oportunidades. No es tu conexión, es nuestra.</p>
      <button onClick={reset} className="mt-3 min-h-tap rounded-pill bg-lime px-5 font-medium text-primary-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bg">Reintentar</button>
    </div>
  );
}
