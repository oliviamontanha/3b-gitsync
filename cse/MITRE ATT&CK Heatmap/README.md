Shows how the security team's detection inventory maps onto the MITRE ATT&CK matrix, so gaps in coverage are visible at a glance. Detections come from Tines Records, so the heatmap reflects whatever the team currently has deployed. The matrix itself — tactics, techniques, sub-techniques, and threat-group technique mappings — is pulled from MITRE weekly rather than hardcoded.

**Triggers**

- [Heatmap](Heatmap/App.tsx) — the webpage at `/mitre-heatmap`, the entry point a person opens.
- [Detections API](<Detections API/script.ts>) — the JSON endpoint at `/mitre-detections`, fetched by the page in the browser.
- [Matrix API](<Matrix API/script.ts>) — the JSON endpoint at `/mitre-matrix`, also fetched by the page in the browser.
- [Refresh detections](<Refresh detections/script.ts>) — scheduled every 15 minutes, no route.
- [Refresh ATT&CK](<Refresh ATT&CK/script.ts>) — scheduled Mondays at 04:00 UTC, no route.

**The flow**

`Refresh detections` pulls every record from the `Detections` record type (`record_type_id` 55126) in the Collab team (78834) on Olivia and caches it as JSON on the `detections` volume. `Detections API` serves that cached snapshot at `/mitre-detections`, falling back to a live Tines fetch if the cache isn't there yet.

`Refresh ATT&CK` downloads MITRE's Enterprise ATT&CK STIX bundle, normalizes it, and writes it to the `attack_matrix` volume; `Matrix API` serves that snapshot at `/mitre-matrix`.

The `Heatmap` React app renders the ATT&CK matrix shell immediately, fetches both endpoints, and computes per-technique coverage, thresholds, and threat-intel scoping client-side. If the matrix endpoint is unavailable it falls back to a bundled copy of the matrix and flags that in the header.

**External services**

Tines Records, via the Tines Stories connector attached to both detection steps. Credentials are injected at runtime; `TINES_URL` is the only environment variable used. The ATT&CK bundle is fetched from MITRE's public `attack-stix-data` repository and needs no credential.

**Side effects**

Read-only with respect to Tines and MITRE — nothing is written back. The only state written is the cache on the `detections` volume and the snapshot on the `attack_matrix` volume.

**Operational notes**

Changes made in Tines Records appear on the heatmap within 15 minutes; run `Refresh detections` manually to pick them up immediately. If Tines errors or returns zero records, the refresh step fails and the previous cache is kept rather than showing an empty matrix — so an alert on that step's failure is worth having. Test-mode records are excluded.

`Refresh ATT&CK` behaves the same way: it sanity-checks the bundle and fails rather than publishing something implausible, keeping the previous snapshot. Cron only fires on the published version, and volume files are per-branch, so a fresh draft branch starts with no snapshot and the page uses its bundled fallback until the step is run manually there.

**Common changes**

- Point at a different record type: change `RECORD_TYPE_ID` and `FIELD_IDS` in [Refresh detections/tinesRecords.ts](<Refresh detections/tinesRecords.ts>) and the matching copy in [Detections API/tinesRecords.ts](<Detections API/tinesRecords.ts>).
- Change refresh frequency: edit `cron` in [Refresh detections/config.toml](<Refresh detections/config.toml>) or [Refresh ATT&CK/config.toml](<Refresh ATT&CK/config.toml>).
- Change what's derived from ATT&CK (extra fields, other domains, campaigns): [Refresh ATT&CK/script.ts](<Refresh ATT&CK/script.ts>).
- Change coverage thresholds or colors: [Heatmap/hooks/useDetections.ts](Heatmap/hooks/useDetections.ts) and [Heatmap/constants.ts](Heatmap/constants.ts).
- Edit the compliance-standard mappings (curated, not from MITRE): [Heatmap/data.ts](Heatmap/data.ts).
