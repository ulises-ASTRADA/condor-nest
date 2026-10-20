// Builds a redirect URL on the same host as the incoming request (so previews stay on the preview).
// The path is always a fixed internal path; only allowlisted query params are added, URL-encoded.
export function sameOriginUrl(req: Request, path: `/${string}`, params: Record<string, string | null | undefined> = {}): URL {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('bad path');
  const u = new URL(path, new URL(req.url).origin);
  for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v);
  return u;
}
