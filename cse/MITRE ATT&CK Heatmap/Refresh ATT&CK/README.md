Downloads MITRE's official Enterprise ATT&CK STIX 2.1 bundle each week and publishes a normalized copy for the heatmap to read.

**Trigger:** cron `0 4 * * 1` (Mondays, 04:00 UTC). Cron only fires on the published version — run this step manually to seed a draft branch.

**Source:** [`enterprise-attack.json`](https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json) from the `mitre-attack/attack-stix-data` repository. This is the machine-readable bundle that [attack.mitre.org/matrices/enterprise](https://attack.mitre.org/matrices/enterprise/) is generated from. It is public, so no connector is needed.

**What it derives** ([script.ts](script.ts)):

- **tactics** — `x-mitre-tactic` objects, ordered by the `x-mitre-matrix` object's `tactic_refs` so columns match the published matrix. Column abbreviations are keyed by the stable `TAxxxx` id, since MITRE renames tactics between releases.
- **techniques and sub-techniques** — `attack-pattern` objects, one row per kill-chain phase so a technique appears under every tactic it belongs to. Revoked, deprecated, and non-enterprise entries are skipped.
- **threat groups** — `intrusion-set` objects joined to techniques through `uses` relationships, giving each group its real technique list (including sub-technique ids), aliases, and last-modified date.

**Output:** writes `/storage/attack_matrix/matrix.json` — `{ version, fetchedAt, tactics[], techniques[], groups[] }` — to the `attack_matrix` volume, via a temp file and rename so readers never see a partial file. The volume is mounted `concurrency=exclusive` because every run rewrites the same file. [Matrix API](<../Matrix API/README.md>) serves it.

Before publishing, the run is sanity-checked for at least 12 tactics, 200 techniques, and 50 groups. If the bundle looks wrong the step fails and the previous copy is left untouched. Counts and the ATT&CK version are logged to stderr; stdout carries the same summary as JSON.
