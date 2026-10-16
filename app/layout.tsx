import { Cursor } from '@/components/Cursor';
import type { Metadata, Viewport } from 'next';
import { Unbounded, Space_Grotesk, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SITE } from '@/lib/site';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ClientBoot } from '@/components/ClientBoot';
import { Analytics } from '@vercel/analytics/next';

// Variable fonts: one file each for Unbounded and Space Grotesk, plus Geist Mono 500.
// Display face uses 'optional': the hero H1 is the mobile LCP; no late swap means LCP lands on first paint (fallback metrics are adjusted).
const unbounded = Unbounded({ subsets: ['latin', 'latin-ext'], display: 'optional', variable: '--font-unbounded' });
const grotesk = Space_Grotesk({ subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-space-grotesk' });
const mono = Geist_Mono({ subsets: ['latin', 'latin-ext'], weight: '500', display: 'swap', variable: '--font-geist-mono' });

const TITLE = 'Condor Nest · Hackathons, bounties y grants para builders LatAm';
const DESC = 'Hackathons, bounties y grants abiertos a Argentina y LatAm, en español y actualizados todos los días. Deadlines en tu hora local.';
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: '%s · Condor Nest' },
  description: DESC,
  openGraph: { title: TITLE, description: DESC, siteName: 'Condor Nest', locale: 'es_AR', type: 'website', url: '/' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC },
  robots: { index: true, follow: true }, // indexing ON by owner decision (2026-10-14)
  verification: { google: 'd3KINZQI8s8konhUVjj6G0Xrn62Bybx0eynzeu4_iC0' },
};
export const viewport: Viewport = { themeColor: '#07080B', colorScheme: 'dark light', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

// Runs before paint: theme + reduced-motion preference from localStorage (no flash).
const boot = `try{var t=localStorage.getItem('cn-theme');if(t==='light')document.documentElement.classList.add('light');if(localStorage.getItem('cn-reduce-motion')==='1')document.documentElement.setAttribute('data-reduce-motion','')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" suppressHydrationWarning className={`${unbounded.variable} ${grotesk.variable} ${mono.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: boot }} /></head>
      <body className="min-h-dvh font-sans text-base antialiased">
        <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-pill focus:bg-lime focus:px-4 focus:py-2 focus:text-primary-fg">Saltar al contenido</a>
        <div className="bg-aurora" aria-hidden="true"><div className="blob b1" /><div className="blob b2" /><div className="blob b3" /></div>
        <div className="bg-grid" aria-hidden="true" /><div className="bg-noise" aria-hidden="true" />
        <Header />
        <main id="contenido" className="mx-auto max-w-content px-4 pb-24 lg:px-6">{children}</main>
        <Footer />
        <ClientBoot /><Cursor />
        <Analytics />
      </body>
    </html>
  );
}
