import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-card border border-border bg-surface p-6 text-center">
      <p>Esta oportunidad ya no existe o cambió de link.</p>
      <Link href="/" className="mt-3 inline-flex min-h-tap items-center rounded-pill bg-lime px-5 font-medium text-primary-fg">Volver al feed</Link>
    </div>
  );
}
