import Link from 'next/link';
import { Wordmark } from './Brand';
import { ThemeToggle } from './Toggles';
import { MusicToggle } from './Music';
export function Header() {
  return (
    <header className="site-header sticky top-0 z-40 border-b border-transparent">
      <div className="mx-auto flex h-14 max-w-content items-center justify-between gap-4 px-4 lg:px-6">
        <Link href="/" prefetch={false} aria-label="Condor Nest, inicio" className="rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"><Wordmark /></Link>
        <div className="flex items-center"><MusicToggle /><ThemeToggle /></div>
      </div>
    </header>
  );
}
