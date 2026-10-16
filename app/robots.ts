import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
// Indexing ON by owner decision (2026-10-14). API and newsletter status pages stay out.
export default function robots(): MetadataRoute.Robots {
  const disallow = ['/api/', '/newsletter/'];
  const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Googlebot', '*'];
  return { rules: bots.map((userAgent) => ({ userAgent, allow: '/', disallow })), sitemap: `${SITE}/sitemap.xml`, host: SITE };
}
