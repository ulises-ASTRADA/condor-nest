# Organizer feedback survey

`/como-nos-conociste?token=…` uses personal invitations associated with an existing `/publicar` submission. No email is sent, no account is created, and the five-question survey does not ask for contact details again. The interface explicitly states that answers are associated with the organizer's existing name/email. A forwarded link can be completed by its holder: this is recipient association, not verified identity.

## Data

- `cn_feedback_invitations`: submission ID, name/email snapshot, unique normalized email, SHA-256 of a random 64-character token, optional revocation timestamp.
- `cn_feedback_responses`: one answer per invitation, five answers, unique 30% discount code, optional redemption timestamp and event slug.
- Both tables have RLS enabled, no public policies, and no anon/authenticated access. Three RPCs are executable only by the service role. No contact details or previous answers are returned to browsers.
- The submit RPC locks the invitation row: retries return the same discount without changing the first answers. A discount is issued only after successful persistence. The featured request form validates codes server-side and reserves them for 48 hours. Payment confirmation consumes the code; there is no automatic checkout yet. See `featured-pricing.md`.
- Survey pages are dynamic/no-store/noindex, use no-referrer and do not load site analytics. Local development without a token remains a non-persistent demo. Production requires a valid invitation.

## Create an invitation (admin SQL only)

Use the exact submission ID after reviewing `cn_submissions`. Each email can have one invitation, including when the organizer submitted multiple events. Keep the generated link privately; only its hash is stored.

```sql
with token as materialized (
  select replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') as raw
), invitation as (
  select public.cn_feedback_create_invite(
    3, -- replace with the reviewed submission ID
    encode(sha256(convert_to(raw, 'UTF8')), 'hex')
  ) as id, raw from token
)
select 'https://condor-nest.lat/como-nos-conociste?token=' || raw as survey_url
from invitation;
```

Creating the link never sends it. Share it only with its intended recipient. To revoke it, set that invitation's `revoked_at = now()`; do not delete response history.

## Read responses with contact details

```sql
select r.created_at, i.name, i.email, i.submission_id,
  r.source, r.source_other, r.purpose, r.rating, r.useful, r.improve,
  r.discount_code, r.discount_percent, r.redeemed_at
from public.cn_feedback_responses r
join public.cn_feedback_invitations i on i.id = r.invitation_id
order by r.created_at desc;
```

## Use the discount for a featured placement

The organizer enters the code at `/destacar` with the same contact email as the survey. The server applies 30% and atomically reserves it with the pending request. Use the admin-only `cn_featured_mark_paid` function after verifying actual payment; see `featured-pricing.md`. Do not directly update redemption timestamps, which would bypass request reconciliation.
