Pulls every detection from Tines Records and caches it so the heatmap page never waits on the Tines API.

Runs on a schedule (`*/15 * * * *`) and can be run manually at any time.

**Source:** the `Detections` record type (`record_type_id` 55126) in the Collab team (78834) on Olivia — fields `Name`, `Source`, `Techniques`. Reached via `GET {TINES_URL}/api/v1/records`, paginated at 500 per page, following `meta.next_page`. Authentication comes from the attached Tines Stories connector. Test-mode records are excluded (the API default).

**Cache:** writes `/storage/detections/detections.json` — `{ records, count, refreshed_at }` — on the `detections` volume, mounted read-only by [the Detections API step](<../Detections API/script.ts>).

The fetch logic lives in [tinesRecords.ts](tinesRecords.ts). If Tines errors, rate-limits past five retries, or returns zero records, the step exits non-zero and leaves the previous cache intact rather than publishing an empty coverage set.
