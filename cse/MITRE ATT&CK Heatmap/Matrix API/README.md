Serves the cached MITRE ATT&CK snapshot to the [Heatmap](../Heatmap/README.md) page.

**Trigger:** HTTP `GET /mitre-matrix`, restricted to members of this space (`route_auth = "space"`). The heatmap page fetches it client-side, so the browser session already carries the credential.

Reads `/storage/attack_matrix/matrix.json` from the `attack_matrix` volume, mounted read-only, and returns it verbatim with a five-minute `Cache-Control`. [Refresh ATT&CK](<../Refresh ATT&CK/README.md>) writes that file weekly.

If no snapshot has been written yet the step returns `404` with `{ "error": … }`, which is the signal the heatmap uses to fall back to its bundled copy of the matrix. The response contract is documented in [api.json](api.json).
