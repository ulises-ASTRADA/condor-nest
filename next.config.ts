import type { NextConfig } from 'next';
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com", // Next.js inline bootstrap; move to nonces later
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data:",
  "font-src 'self' data:",
  "media-src 'self'",
  `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''} https://challenges.cloudflare.com`.trim(),
  "frame-src https://challenges.cloudflare.com https://www.google.com",
  "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "upgrade-insecure-requests",
].join('; ');
const config: NextConfig = {
  poweredByHeader: false,
  // Always resolve metadata into the initial <head> (no streamed metadata in <body>) so every crawler/AI bot sees description, canonical and OG.
  htmlLimitedBots: /.*/,
  experimental: { optimizePackageImports: ['motion'] },
  async redirects() {
    // Old production hostname → custom domain (alias redirect also set in Vercel).
    return [{ source: '/:path*', has: [{ type: 'host', value: 'condor-nest.vercel.app' }], destination: 'https://condor-nest.lat/:path*', permanent: true }];
  },
  async headers() {
    // Indexing ON in production (owner decision, 2026-10-14). Previews, API routes and newsletter status pages stay noindex.
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    return [
      ...(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production' ? [{ source: '/:path*', headers: noindex }] : []),
      { source: '/api/:path*', headers: noindex },
      { source: '/newsletter/:path*', headers: noindex },
      { source: '/go/:path*', headers: noindex },
      { source: '/:path*', headers: [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      ] },
      // Token-bearing pages: never send the URL (with the token) as Referer, never cache. Listed last so it overrides the default Referrer-Policy.
      { source: '/newsletter/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'Cache-Control', value: 'no-store' }] },
      // /go/ click redirects: the external site gets no referrer (same as the old rel="noreferrer" direct link). Listed last to override the default.
      { source: '/go/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }] },
    ];
  },
};
export default config;
