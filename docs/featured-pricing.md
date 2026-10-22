# Featured placement proposal

`/destacar` is an explicitly labeled prototype, published to production at the owner's request on 2026-10-22 after local review. It does not submit requests, send mail, collect payment, reserve inventory or redeem real feedback codes. `PRUEBA30` simulates a 30% discount; real codes are deliberately rejected in this prototype. The review screen is explicitly a simulation.

Proposed launch catalog (not approved/published): USD 19 / 7 days, USD 29 / 14 days, USD 49 / 30 days. `lib/featured-pricing.ts` centralizes the catalog. Arithmetic uses integer cents, and the discount recalculates when switching durations. Campaign end dates are inclusive.

The model charges per event and duration, without an ongoing subscription. All durations include the same shared featured feed space and label. No guaranteed clicks, registrations, exclusive position, newsletter or social promotion. Future pricing changes should be driven by observed traffic, clicks and renewals, not assumed reach. Evvnt's official syndication page lists a starting price of $29 (checked 2026-10-22), but its multi-site distribution is not equivalent to this single-site placement: https://evvnt.com/event-creators/syndication/

Before enabling live requests:

- Agree on catalog, currency, tax treatment and availability; allow personalized quotes if the owner chooses that model instead.
- Validate survey codes server-side against `cn_feedback_responses` and the associated email; never trust client-supplied percentages, totals or code existence.
- Persist contact/event, selected dates, catalog version, subtotal, discount and total as a server-authoritative quote in Supabase, with an idempotency key.
- Availability and payment confirmation must precede activation. If payment is added, use a verified server webhook to consume a code and activate a campaign in one idempotent transaction. Protect against two requests redeeming the same code, and release temporary reservations after failure/expiry. A preview must never consume it.
- Decide on payment method, cancellation/refund policy and how shared placements rotate. The prototype currently only previews the request; it has no payment integration or backend persistence.

Required fields have visible red asterisks. Optional notes and optional coupon do not. Returning from review preserves values. Existing `/publicar` and survey remain unchanged.

The prototype starts with blank event fields, with “Tu evento” and “Tu organización” as display fallbacks. No actual event, brand or fictional email is prefilled. Deleting entered names restores these generic labels rather than the original event prop. The real invitation flow can resolve existing context server-side from its submission. Contact email, if present in that context, is displayed; no invented contact appears in the review. Internal `/o/` routing is entirely managed by Condor Nest, with no input for the internal URL or slug.

Owner chose duration-based pricing on 2026-10-22, initially requested local-only work, and then explicitly requested production deployment. The deployment publishes the existing prototype, without enabling live requests, email or payments.

The local form includes editable prize, event start/end dates, featured duration, and a separate featured start date. Known event values are prefilled. Prize can explicitly say “Sin premio”; end date cannot precede event start. The review preserves and displays all values separately from campaign dates. These are local-only edits, not updates to the published event.

Event details also include editable event name, short description (300 chars), eligibility, registration HTTPS URL, organizer name/about, and modality (presencial/virtual/híbrido). Physical/hybrid events require a venue address, used for a Google Maps preview on the review screen. Virtual events disable the address field and omit both the address and map from review, ignoring any prior physical address. Switching back preserves the draft address. Condor Nest still generates the internal event URL; the only URL organizers enter is their external registration link.

Location also accepts HTTPS Google Maps URLs, including short links. Addresses and full links containing a place/query show an embedded map plus a Maps link. Short links and links without a searchable place preserve the original “Abrir ubicación en Google Maps” link; they are not embedded as address searches. No remote short-link resolution is performed in this local prototype. The modality select keeps native keyboard behavior with a custom inset chevron replacing the browser arrow.

Organizer contact has an editable required email (`type=email`, 254 chars) and optional phone (`type=tel`, country code encouraged, 40 chars). Both start blank in the prototype. Review includes email and only includes a phone when supplied. The header follows the current email and returns to the generic organization label if it is cleared. No emails or calls are triggered.
