import { welcomeEmail } from './welcome-email';

type Dependencies = {
  rpc: (name: string, args: unknown) => Promise<unknown>;
  send: (payload: Record<string, unknown>, idempotencyKey: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
};

// The confirmation transaction emits a delivery job only once. Mail failures must
// never undo a confirmed subscription or expose recipients in the public response.
export async function confirmWithWelcome(confirmHash: string, unsubscribeToken: string, unsubscribeHash: string, siteUrl: string, deps: Dependencies) {
  const result = await deps.rpc('cn_confirm_with_welcome', { confirm_hash: confirmHash, unsub_hash: unsubscribeHash }) as { status: string; welcome?: { id: string; email: string } };
  if (result.status !== 'confirmed') return 'invalido' as const;
  if (result.welcome) {
    const unsubscribeUrl = `${siteUrl}/newsletter/baja?token=${unsubscribeToken}`;
    const oneClickUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;
    let error: string | null = null;
    try {
      const sent = await deps.send({ to: [result.welcome.email], ...welcomeEmail(siteUrl, unsubscribeUrl), headers: { 'List-Unsubscribe': `<${oneClickUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } }, `newsletter-welcome-${result.welcome.id}`);
      if (!sent.ok) error = sent.reason;
    } catch { error = 'send_failed'; }
    try { await deps.rpc('cn_welcome_delivery', { welcome_id: result.welcome.id, delivery_error: error }); }
    catch { console.error('newsletter: welcome delivery status failed'); }
  }
  return 'confirmado' as const;
}
