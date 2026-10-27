import { test } from 'node:test';
import assert from 'node:assert/strict';
// SITE is read once at import: set a www SITE_URL first, then load the modules that build public URLs.
process.env.SITE_URL = 'https://www.condor-nest.lat/';

test('a www SITE_URL never leaks: robots sitemap/host and JSON-LD @id/url use https://condor-nest.lat', async () => {
  const { SITE } = await import('./site.ts');
  assert.equal(SITE, 'https://condor-nest.lat');
  const robots = (await import('../app/robots.ts')).default();
  assert.equal(robots.sitemap, 'https://condor-nest.lat/sitemap.xml');
  assert.equal(robots.host, 'https://condor-nest.lat');
  const ld = await import('./jsonld.ts');
  const json = JSON.stringify(ld);
  assert.doesNotMatch(json, /www\.condor-nest/);
  assert.match(json, /https:\/\/condor-nest\.lat/);
});
