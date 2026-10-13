import 'server-only';
// Server-only Supabase access. SUPABASE_SERVICE_ROLE_KEY must NEVER be NEXT_PUBLIC_ or imported from client code.
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export async function serverRpc(fn: string, args: unknown) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify(args), cache: 'no-store' });
  const text = await r.text();
  if (!r.ok) throw new Error(`rpc ${fn} ${r.status}`);
  return text ? JSON.parse(text) : null;
}
