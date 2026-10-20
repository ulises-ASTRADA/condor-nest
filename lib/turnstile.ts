/** Server-side Turnstile check. Fails closed whenever TURNSTILE_SECRET_KEY is unset (production and preview); only `next dev` skips it. */
export async function turnstileOk(token: unknown, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV === 'development';
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret, response: token, remoteip: ip }), signal: AbortSignal.timeout(5000) });
    return !!(await r.json()).success;
  } catch { return false; }
}
