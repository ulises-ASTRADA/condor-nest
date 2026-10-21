# Structured data policy

Updated: 2026-10-21.

- Collection pages (the homepage and topic/country hubs) expose `ItemList` entries with names, positions and links to individual opportunity pages. They do not embed `Event` objects.
- A detail page can expose one `Event` when the listing has a start date. Google recommends its event experience markup on pages focused on a single event.
- `organizer` describes the verified host. Hosting alone does not establish that the organization is a performer.
- The data model currently has no verified performer field, so `performer` is omitted. Do not copy the organizer, insert an empty value, or invent a speaker to clear a recommended-property warning.
- A missing recommended property can remain in Search Console without invalidating an otherwise valid event. Do not promise that all warnings will disappear.

Reference: https://developers.google.com/search/docs/appearance/structured-data/event

## Verify a release

Inspect the served HTML JSON-LD for `/hackathons-ia` and a country hub: retain `CollectionPage`, `ItemList` links and breadcrumbs, with no nested `Event`. Inspect `/o/hacktoberfest-mexico-2026`: retain the detail `Event`, its organizer, dates, location and registration link, with no fabricated performer. Test representative URLs in Google's Rich Results Test. Search Console reports reflect Google's last crawl and need time to update.
