import { SITE } from './site';
/** Public IndexNow key; the matching key file is served from /public/<key>.txt. Not a secret by design. */
export const INDEXNOW_KEY = '6c582f2100a3deed5d7c42291495cf04';
/** Ping IndexNow (Bing, Yandex, etc.) with updated URLs. Fails silently; skipped outside production. */
export async function pingIndexNow(urls: string[]): Promise<number | null> {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') return null;
  const list = [...new Set(urls)].filter((u) => u.startsWith(SITE)).slice(0, 10000);
  if (!list.length) return null;
  try {
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(SITE).host, key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList: list }),
      signal: AbortSignal.timeout(8000),
    });
    return r.status;
  } catch { return null; }
}
