# Privacy review — implemented local prototype

**Result:** source and generated-artifact audit completed. No app-managed snapshot files,
image logs, persistent sketch storage, or cached-image fallbacks were found.

- Drawing/history/selection and owner capability remain in browser-tab memory. Canvas
  rendering buffers are local drawing state; only a detached selected crop enters a read.
- Preview and capture share one clipped renderer. Empty/absent selection returns an error.
- MCP exposes one strict read tool. Session IDs authorize nothing; owner/read roles differ.
  Rotation, lease expiry, end, and restart revoke pending/future access.
- The broker keeps hashes in the registry, one pending read, and metadata-only last-sent
  status. A separate authenticated local-operator handoff slot temporarily holds the
  explicitly paired native client's read key; it is never persisted or enumerated.
- The bootstrap in owner-only ignored `.env.voice.local` is the user-authorized operator
  setup credential. It cannot directly read MCP or manage canvas sessions. Native helper
  stdout is a private host credential channel and must not be manually logged into chat.
- Browser management validates Host/Origin plus a custom header and owner authorization.
  MCP validates read authorization, with no wildcard CORS. The broker binds loopback;
  only the exact configured private UI origin is permitted for phone access.
- Responses are no-store. Source logging is limited to startup/fixed errors; it never emits
  request bodies, capabilities, drawing paths, or image data. Input failures use safe errors.
- PNG validation checks dimensions/size, checksums, bounded decompression, timestamps,
  revisions, and strict allowed fields. An actual unknown-field leakage risk was caught by
  a failing regression and fixed before the final passing suite.
- Browser traces, screenshots, and videos are disabled. Audited generated results contain
  zero media artifacts, zero bootstrap matches, and zero bearer/credential-line patterns.
  Test subprocess output with native helper headers is consumed in memory, never printed.

Images already supplied to the AI client follow that client's retention policy. JavaScript
garbage collection does not guarantee immediate physical memory erasure. These boundaries
are stated to users; the app does not claim it can delete already-sent content.
