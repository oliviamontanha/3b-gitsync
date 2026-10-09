Serves the MITRE ATT&CK coverage heatmap as a browser page at `/mitre-heatmap` (space-authenticated). The page renders immediately and fetches detection records client-side from the [Detections API](<../Detections API/script.ts>) route, so nothing blocks on upstream steps.

Techniques, tactics and threat-group mappings come from MITRE. [hooks/useMatrix.ts](hooks/useMatrix.ts) fetches the weekly snapshot from the [Matrix API](<../Matrix API/README.md>) route (`/mitre-matrix`) client-side; the header shows the ATT&CK version and refresh date. If that request fails — typically because [Refresh ATT&CK](<../Refresh ATT&CK/README.md>) hasn't run yet on this branch — the page falls back to the bundled copy in [techniques.txt](techniques.txt) via [data.ts](data.ts) and says so in the header. Coverage levels are derived from the number of detections per technique, using the thresholds the viewer configures.

**Threat intelligence and scoped coverage**

The Threat Intelligence picker ([components/ThreatGroupPicker.tsx](components/ThreatGroupPicker.tsx)) lists every ATT&CK group, searchable by name, ATT&CK id, or alias (searching "Cozy Bear" finds APT29), with each group's technique count and an option to show only groups MITRE updated in the last year.

Selecting groups or compliance standards defines a scope, built by `buildThreatIntelScope` in [utils.ts](utils.ts). A technique is in scope when it is listed explicitly, when its parent is listed, or when one of its sub-techniques is — so a group that only uses `T1566.001` still puts `T1566` in scope without implying its siblings. Header stats, per-tactic rollups, and gap counts are all computed over the in-scope techniques; out-of-scope cells stay on the grid, dimmed, so the excluded part of the matrix is still visible.

The four compliance standards (NIST CSF, CIS, PCI DSS, ISO 27001) remain a curated mapping in [data.ts](data.ts) — MITRE publishes no such crosswalk.

**View state persistence**

All view state — color scheme, custom colors, thresholds, compliance standards, threat groups, data sources, coverage levels, search query, display mode, sub-technique visibility — is persisted by [filterState.ts](filterState.ts):

- Every change writes the state to `localStorage` under `mitre-heatmap-filters` and rewrites the URL query string with `history.replaceState`.
- On load, state is merged as defaults → `localStorage` → URL params, so a shared link reproduces the exact view and a plain reload restores the viewer's own last settings.
- Only values differing from the defaults appear in the URL, keeping a default view's URL clean. `branch` and `external_id` params are preserved.
- Every decoded value is validated against the allowed values in [types.ts](types.ts) — unknown schemes, bad hex, and out-of-range thresholds are discarded.
- Standard and group ids can't be validated at load time, because the group catalogue only arrives with the matrix snapshot. They are shape-checked on load and reconciled against the loaded snapshot afterwards, so unknown ids are dropped rather than breaking the view. Group ids are MITRE's stable `Gxxxx` ids; the legacy slugs used before the switch to live data (`apt29`, `apt28`, `apt41`, `lazarus`, `fin7`) are mapped forward in [constants.ts](constants.ts) so older shared links still resolve. `lockbit` has no ATT&CK group entry — LockBit is modelled as malware, not an intrusion set — so that one selection is simply dropped.

"Reset to defaults" in the Thresholds popover ([components/FilterPanel.tsx](components/FilterPanel.tsx)) restores the defaults, which clears both the saved copy and the URL.

Color-scheme Tailwind classes are built at runtime from the selected scheme, so they are safelisted with `@source inline(...)` in [globals.css](globals.css) — add any new scheme there as well as in `FilterState`.
