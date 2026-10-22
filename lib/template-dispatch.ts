type Dependencies = {
  rpc: (name: string, args: unknown) => Promise<unknown>;
  send: (payload: Record<string, unknown>, idempotencyKey: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
};

// Only an operator can enqueue a recipient/template in the private table.
// The request carries a short-lived capability, never mail content or an address.
export async function dispatchTemplate(tokenHash: string, deps: Dependencies) {
  const job = await deps.rpc('cn_claim_template_mail', { dispatch_hash: tokenHash }) as null | { id: string; email: string; template_id: string };
  if (!job) return 'invalid';
  let error: string | null = null;
  try {
    const sent = await deps.send({ to: [job.email], template: { id: job.template_id } }, `template-mail-${job.id}`);
    if (!sent.ok) error = sent.reason;
  } catch { error = 'send_failed'; }
  await deps.rpc('cn_template_mail_delivery', { dispatch_id: job.id, delivery_error: error });
  return error ? 'failed' : 'sent';
}
