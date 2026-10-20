import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
// Indexing ON by owner decision (2026-10-14). API, newsletter status pages and /go/ click redirects stay out.
export default function robots(): MetadataRoute.Robots {
  const disallow = ['/api/', '/newsletter/', '/go/'];
  const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Googlebot', '*'];
  return { rules: bots.map((userAgent) => ({ userAgent, allow: '/', disallow })), sitemap: `${SITE}/sitemap.xml`, host: SITE };
}
