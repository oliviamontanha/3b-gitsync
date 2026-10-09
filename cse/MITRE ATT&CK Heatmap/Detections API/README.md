Serves the detection inventory as JSON at `GET /mitre-detections` for [the Heatmap step](../Heatmap/App.tsx) to fetch in the browser.

Reads the cached snapshot at `/storage/detections/detections.json`, written by [the Refresh detections step](<../Refresh detections/script.ts>) on the read-only `detections` volume. On a cache miss (first deploy, or a fresh draft branch) it falls back to fetching live from Tines Records via [tinesRecords.ts](tinesRecords.ts), so the page always has data.

Response: `{ records: [{ Name, Source, Techniques }], count, refreshed_at, source }` where `source` is `"cache"` or `"live"`. `Techniques` is a comma-separated list of MITRE technique IDs.

Contract documented in [api.json](api.json). The route is space-authenticated.
