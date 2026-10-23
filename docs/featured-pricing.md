# Featured placement requests

Production `/destacar` now accepts requests. Development keeps a non-persistent demo (`PRUEBA30`); production accepts only real survey codes. Sending stores a request and sends transactional emails; it never charges money or activates a featured event.

## Pricing and persistence

The launch catalog in `lib/featured-pricing.ts` is USD 19 / 7 days, USD 29 / 14 days, USD 49 / 30 days. The API recalculates the price; client totals or percentages are ignored. `cn_featured_requests` freezes the full normalized event/contact details, plan, campaign dates, subtotal, discount, total, currency and expiry. Prices use integer cents. Campaign dates are inclusive. Event start/end dates are separate from campaign dates. Blank fields show generic labels instead of real event data. Required fields have red asterisks; phone and notes are optional.

`POST /api/destacar` has same-origin enforcement, payload validation, Turnstile, an IP limiter and durable hourly database caps. A SHA-256 fingerprint of normalized fields makes retries return the same request. Stored details are not returned to the browser. RLS is enabled and all table access and RPC execution are restricted to the service role. The page is noindex and excluded from site analytics.

## Discounts

`POST /api/destacar/codigo` validates the real code against its survey email, invitation revocation and redemption status. The save RPC rechecks and reserves the code atomically with the request. A second active request cannot reserve it. Previewing alone never reserves or consumes it. Reservations expire after 48 hours; cancellation also releases them. Changing contact email clears the applied code in the UI.

Requests begin as `pending_payment`; the 48-hour quote is not a payment link or a booking guarantee. Payment provider and inventory activation are still pending. To cancel, update only the specific reviewed request status to `cancelled`. Do not delete request history.

After verifying actual receipt of payment externally, an administrator can run:

```sql
select public.cn_featured_mark_paid('REVIEWED-REQUEST-UUID', 'VERIFIED-PAYMENT-REFERENCE');
```

This service/admin-only function locks the request, rejects cancelled/expired requests, and marks the reserved coupon redeemed in the same transaction. It does not charge money, verify a payment provider, issue a tax invoice or activate an event. Never call it based only on a browser redirect, screenshot or customer claim. When a provider is chosen, a verified webhook should perform the equivalent reconciliation using provider reference, amount and currency.

## Mail

Resend sends a confirmation to the organizer and a notice to the existing `PUBLICAR_NOTIFY_TO` address, using existing `RESEND_FROM` and `RESEND_API_KEY`. The organizer copy includes the frozen total, reference, review/payment next steps and Condor Nest signature. The internal copy includes all submitted fields and replies to the organizer. Confirmation replies go to the notification mailbox. Neither subscribes the person to promotional email.

Delivery is attempted only after persistence. The two per-recipient statuses (`owner_mail_status`, `contact_mail_status`) record `sent` or a short failure reason. Stable Resend idempotency keys and sent-status checks suppress duplicate notifications on retries. Resend's existing bounded retry helper is reused. A failed mail never discards a saved request. There is no scheduled mail queue yet; review failed/pending statuses in Supabase and retry within the provider's idempotency window.

```sql
select id,created_at,event_name,contact_email,status,total_cents,currency,
  owner_mail_status,contact_mail_status,expires_at
from public.cn_featured_requests order by created_at desc;
```

## Event information

### Precompleted invitations from `/publicar`

When `wants_featured=true`, the API uses `cn_submit_featured` to save the original submission and create a private invitation atomically. It generates 32 random bytes; only the SHA-256 token hash is stored in `cn_featured_invitations`. The internal submission notice includes `/destacar?solicitud=TOKEN` and its expiry, ready for the operator to share after review. It does not automatically send a new invitation email to the organizer. Existing free submissions still use `cn_submit`.

The invitation lasts **5 days (120 hours) from creation**, independently of the existing 48-hour quote/coupon reservation after saving a featured request. `cn_featured_invite_read` discloses the original fields only for a valid, unrevoked, unexpired link. Reissue with the service/admin-only `cn_featured_invite_create(submission_id, sha256_new_token)`; older links are revoked. Share only the new original token, never the hash. Links are bearer capabilities: anyone holding one can view that submission, so keep them private and share only with its organizer. No emails, names or submission IDs are encoded into URLs.

The page prepopulates title, contact email, prize, official URL and location; an explicitly Online/Virtual/Remoto location sets virtual modality. Everything remains editable. Original free-text dates/notes and contact name appear as reference, without guessing start/end dates, eligibility or an organization name from a person's name. The official link must be confirmed as the registration link. Missing fields remain empty. Duration appears between Tu evento and Datos del evento.

Submission with an invitation uses `cn_featured_save_from_invite`, which rechecks expiry/revocation under a lock, stores `source_submission_id` and `invitation_id` as foreign keys, and leaves the original submission unchanged. Expired/revoked links cannot save even if opened earlier. Fingerprints include invitation identity so unrelated invitations cannot be reassociated. No token is persisted in the request details or logged. The route is dynamic, noindex, private/no-store, no-referrer and already excluded from site analytics. No ID-based public lookup is exposed; table/RPC access remains service-only.

Database migration: `20261023010000_featured_submission_invitations.sql`. Transactional DB tests: `supabase/tests/featured_invitations.sql`. Unit mapping/notice tests: `lib/featured-invitation.test.ts`. Deploy migration before application code; it is backward compatible with the old public routes. Verification fixtures must use example.invalid addresses and roll back, with no real mail calls.

The form collects name, short description, prize, event dates, modality, location, eligibility, HTTPS registration link, organizer name/about, required contact email and optional phone/notes. Internal URLs and slugs remain managed by Condor Nest. Submitting does not directly modify an existing published event.

Virtual events disable and discard location in the persisted payload. Physical/hybrid events accept a complete address or a Google Maps link. Addresses and full place/query links show an embedded map. Short URLs are preserved as an external Maps link without inventing a map pin. No remote short-link resolution is performed.

## Verification

`npm test` covers request normalization, invalid dates/content, client-price tampering and escaped mail templates, in addition to pricing and map tests. `supabase/tests/featured_requests.sql` checks save/idempotency, email-bound coupons, single reservation, cancellation, mail status, payment-state redemption and public-access denial in a rolled-back transaction. Fixtures never send mail or move money.
