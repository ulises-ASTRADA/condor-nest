import type { NextConfig } from 'next';
const config: NextConfig = {
  experimental: { optimizePackageImports: ['motion'] },
  // Keep search engines out until Ulises decides to launch publicly in search.
  async headers() { return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]; },
};
export default config;
