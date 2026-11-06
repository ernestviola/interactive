# Quickstart: Discuss a Freehand Sketch

The canvas, history, selected-region preview, read-only MCP connection, sharing status,
and reconnect behavior are implemented. Both live voice gates passed; see
[feasibility](feasibility.md) and [test evidence](test-evidence.md).

## Start

Use pnpm 12.15.0; it selects pinned Node 24 automatically. No shell exports are required.

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

For the production build:

```sh
pnpm run build
pnpm run start
```

Open http://127.0.0.1:3000, tap Start drawing, draw, choose Select, and drag a rectangle.
Check the preview, then Connect and ask the configured desktop MCP client to read it.
Clear selection removes the shared region without changing ink or undo/redo; subsequent reads
return NO_SELECTION until you select a region again.
The private local helper configuration is created once; normal pairing requires no token
copying or exports. See the [root README](../../README.md) for the configuration example.
The UI uses port 3000; the broker stays on loopback port 3001. Stop the disposable experiment
before starting the app because it uses the same broker port.

For a phone, configure the exact trusted LAN origin once in ignored .env.local as documented
in the README. Open the Mac's LAN address in Safari on the same Wi-Fi, keep voice on the Mac,
and Connect from the phone canvas. Connecting a different canvas revokes the earlier pairing.

## Verify on demand

```sh
pnpm run verify
```

This runs frozen install, unit/contract tests, browser workflows, typecheck, lint, and build;
it stops at the first failure. It is never installed as a commit hook or scheduled job.
Focused commands are `pnpm run test:unit`, `pnpm run test:contract`, and
`pnpm run test:browser`; add `--grep 'lease expiry'` to the browser command for that scenario.
Browser checks start and stop their own loopback services on ports 3100/3101, use .next-test,
and can run alongside the ordinary app. No shell exports are needed.

Routine automation covers draw/select, undo/redo, limits, crop privacy, snapshot provenance,
blank errors, offline editing, controlled-clock expiry, actual broker restart, explicit
re-pair, old-key revocation, session end, and accessible controls. PNGs remain in memory;
screenshots, video, and traces are disabled. No paid AI service is needed for these checks.

## Session behavior

Ink and history stay in tab memory. Surviving tabs retain ink across broker outages; reconnect
explicitly after restart/expiry. Closing or reloading loses ink. Do not close a tab to test
outage preservation. End session revokes future reads; previously delivered images follow
the AI client's retention settings. Edits never change an earlier snapshot. A last-sent
label means delivery to the client connection, without promising comprehension.

## Acceptance closeout

[Validation results](validation-results.md) report SC-001–SC-007 separately. Physical
iPhone 12 voice, changed captures, undo/redo, preview/status and background/resume were
observed. Native Safari and Chrome functional walkthroughs and restart/re-pair were also checked directly.
The operator waived external physical latency measurements, the five-user pilot and formal
ten-answer target-user grading for this first iteration. The spec is closed; none of those
unrun checks is reported as passing. The exact phone build remains unreported. Automated WebKit is supplemental evidence, not physical Safari acceptance.
