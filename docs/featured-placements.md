# Featured placements

The owner requested two featured hackathons on 2026-10-21: belo first, then HackaTwin. The exact listing slugs and priority live in `lib/featured.ts` (`FEATURED_ORDER`). These are explicit owner-selected placements in addition to any active database `featured` flags; they are not inferred sponsorships.

`isFeatured` partitions cards between featured and organic sections. `featuredListings` sorts the featured section without changing the source array. The homepage renders those cards in that order; the client uses the same helper when filters change, and the homepage ItemList uses the same selection. The old one-featured-card limit has been removed, and filter counts include all matching cards exactly once.

All normal feed filters still apply, including deadlines and search. Featured cards do not also appear in the organic list. Remove a slug from `FEATURED_ORDER` to end an owner-selected placement; the listing then follows its database featured flag. Other database-featured listings follow the explicit placements in their original order.
