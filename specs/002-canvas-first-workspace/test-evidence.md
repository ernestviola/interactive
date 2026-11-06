# Spec 002 implementation evidence

## Setup and baseline (2026-11-05)

- `pnpm install --frozen-lockfile`: passed; 435 pinned packages installed.
- Read Next.js 16.4.5 local guides `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` and `15-route-handlers.md` before source edits.
- `pnpm run test:unit`: 12 passed.
- `pnpm run test:contract`: 32 passed when loopback binding was permitted. The first sandboxed run had 9 `listen EPERM` failures unrelated to assertions.
- `pnpm run typecheck`: passed.
- `pnpm run lint`: passed.
- `pnpm run test:browser`: 22 passed across Chromium and mobile WebKit before product changes.
- The Figma canvas-first concept was reviewed at node `4:2`, with desktop frame `5:2`: cream drawing surface, fine dot grid, top-left interactive wordmark, bottom-centered four-icon toolbar, and a small zoom/fit control.
- The user requested automated and simulated testing without physical-device participation. Physical iPhone and native browser-menu results will remain unverified and will be reported as such.

## Lifecycle feasibility probe

The disposable Playwright probe ran on Chromium and mobile WebKit automation. In both engines, an initial navigation reported `navigate`, a same-tab reload reported `reload` and retained the checkpoint, a `window.open` sibling reported `navigate` and inherited the checkpoint, and a fresh tab after the final close reported `navigate` with no checkpoint. Both engines exposed BroadcastChannel and Web Locks. A live sibling retained its checkpoint after the original tab closed. Browser-menu Restore Closed Tab and browser restart could not be invoked as native user actions through this automated harness; those outcomes are not claimed. The implementation requires a confirmed `reload` or a responding live sibling before reusing a checkpoint.

## Red and green evidence

| Behavior | Intended red result before change | Green result after change |
| --- | --- | --- |
| World coordinates and 50 Undo steps | `world-state`: points clipped to 1024×768; `world-history`: 51st Undo removed older ink | 5 drawing/history tests passed |
| Viewport and gesture transitions | Missing viewport and gesture modules caused the new suites to fail to load | 4 viewport/gesture tests passed |
| Checkpoint and quota rejection | Missing `session-document` module caused the new suite to fail to load | 2 session-document tests passed |
| Direct canvas and hand navigation | New browser journeys could not find the canvas before pressing Start | 2 Chromium journeys passed; later included in full 24-test run |
| Whole-drawing bounds and unreadability | `frameWholeDrawing` was absent | 2 whole-capture tests passed |
| Automatic duplicate-tab broker target | Separate sessions were created and the helper required Connect | 2 automatic-session contract tests passed |
| Duplicate-tab drawing sync | Initial Chromium journey lost a stroke before its copied tab finished joining | Ready-state gate fixed the race; full 24-test run passed |

After replacing obsolete selected-region and manual-Connect assertions, `pnpm run test:unit` passed 18/18, `pnpm run test:contract` passed 32/32, and `pnpm run test:browser` passed 24/24 across Chromium and mobile WebKit. The browser suite disables persisted screenshots, traces, videos, image bytes, and credentials. The configured helper completed a fresh whole-drawing MCP read in both engines without a Connect or selection action. An empty drawing returned `NO_DRAWING` without an image; broker restart preserved drawing and automatic read recovery.

Final integrated run after the additional quota, failover, active-stroke, and touch-label cases: `pnpm run test:unit` passed 19/19, `pnpm run test:contract` passed 32/32, and `pnpm run test:browser` passed 34/34 (17 Chromium and 17 mobile WebKit). `pnpm run typecheck`, `pnpm run lint`, and `pnpm run build` passed. An initial final typecheck exposed a stale `EMPTY_SELECTION` test value; after replacing it with `NO_DRAWING`, typecheck and build passed. The first 34-case browser run exposed an ambiguous test locator for “Draw”; scoping it to the toolbar made the full rerun pass. No application defect was hidden by those two corrections.

Toolbar-focus follow-up: a new browser test failed in both engines because clicking Draw left the button focused and Space could not pan. An initial fix returned focus to the canvas; the browser test then passed and the full suite reached 36/36. User testing showed that the focus transfer was distracting, so it was superseded by the focus-free Space behavior below.

Temporary Hand feedback follow-up: the Space navigation test initially failed in both engines because Draw remained selected in the toolbar while Space was held. The toolbar now shows Hand selected only during the hold and restores the previously selected tool on release. The test also confirms that a permanently selected Hand remains selected afterward. The focused browser test passed 2/2 across Chromium and mobile WebKit; typecheck and lint passed.

Focus-free Space follow-up: the regression test failed in both engines because a pointer click moved focus to the canvas. The app no longer moves focus on toolbar clicks. Space is handled before a focused control's native key action: it temporarily selects Hand, changes the canvas cursor, and pans without activating the control or moving focus; Enter still activates a focused control. The navigation and accessibility suites passed 8/8 across Chromium and mobile WebKit. The updated requirements are in `spec.md` FR-007 and User Story 4 acceptance scenario 3.

Fit/About follow-up: clicking Fit retained focus in Chromium, so the next Space press could act on that control. A new browser test failed on that focus assertion. The same test also exposed retained focus after clicking About in both engines. Pointer clicks now release focus from Fit and About, as they already do from toolbar buttons; keyboard focus remains available. The focused navigation/accessibility run passed 10/10 across Chromium and mobile WebKit, including Space panning after Fit or About and no extra Fit activation from a keyboard-focused Fit control.

## Convergence implementation

| Task | Observed regression before correction | Focused passing result |
| --- | --- | --- |
| T047 | Space pressed during a stroke left two provisional points active instead of cancelling ink | Chromium gesture transition and `NO_DRAWING` read passed |
| T048 | A 500 ms delayed sibling state caused the duplicate to open ready with zero strokes as a separate session | Delayed join passed in Chromium and WebKit |
| T049 | A follower whose checkpoint write failed did not show an unsaved-stroke notice; its coordinator retained a stroke the follower could not recover | Follower quota, coordinator rollback, final-close, and reload path passed in Chromium |
| T050 | A remote gesture whose final message was lost made the next read return an error after the capture deadline | Lost-tab recovery passed in Chromium and WebKit; a separate long active remote stroke waited and captured its committed revision in Chromium |
| T051 | The browser owner `/pair` route returned HTTP 200 and a read capability | Contract test passed: route unavailable, existing helper authorization still works |
| T052 | The 2,000-point limit notice disappeared after pointer release | Overlong-stroke notice passed in Chromium and WebKit |

The new long-stroke browser test dispatches a recorded pointer ID with batched move events after one real pointer-down; Playwright's 2,005 individual mouse steps exceeded the test timeout before reaching the assertion. The behavioral red result was then observed with the batched sequence before the product fix.

Final integrated run after T047–T052: `pnpm run test:unit` passed 19/19, `pnpm run test:contract` passed 33/33, and `pnpm run test:browser` passed 50/50 across Chromium and mobile WebKit. `pnpm run typecheck`, `pnpm run lint`, and `pnpm run build` passed. These tests simulate browser behavior; the remaining physical-device and live-voice gates below are still unverified.

## Visual review

Compared the local UI with Figma frame `5:2` and the mobile frames within concept `4:2`. The first preview revealed a 2-pixel grid SVG scaled to 46 pixels, creating oversized dots; a 46-pixel tile now embeds the original Figma dot at its 2-pixel size. The second preview showed the fine grid, cream surface, interactive wordmark, and bottom-centered four Figma icons at the intended proportions. A broker-outage message that occupied the normal canvas view was removed; connection errors remain available to MCP reads.

After the user's canvas chrome follow-up, the top navbar and About control were removed. The “interactive” wordmark remains over the drawing surface at the top left, and the canvas fills the viewport. The navigation and layout browser tests passed 10/10 across Chromium and mobile WebKit; typecheck and lint passed.

The full browser suite then passed 50/50 across Chromium and mobile WebKit. A subsequent toolbar contrast fix changed the inactive pen icon from white to dark, matching the other inactive icons; the selected button's existing image filter still makes it white. A live toolbar screenshot confirmed both states, and the focused toolbar browser tests passed 4/4 across Chromium and mobile WebKit.

## Automated workload measurement

`canvasWorkload()` creates 500 deterministic 75-point strokes over five starting views. The browser timing harness records 20 drawing, 20 pan, and 20 zoom samples per engine, from input dispatch to the first animation frame after a changed canvas render. A frame-signature filter excludes unrelated renders. It exports only timing summaries. These are automated desktop and simulated mobile measurements, not physical iPhone measurements.

| Engine | Action | Samples | Median ms | p95 ms | Within 100 ms |
| --- | --- | ---: | ---: | ---: | ---: |
| Chromium desktop | Draw | 20 | 16.5 | 16.6 | 100% |
| Chromium desktop | Pan | 20 | 16.4 | 16.5 | 100% |
| Chromium desktop | Zoom | 20 | 16.5 | 16.5 | 100% |
| WebKit mobile emulation | Draw | 20 | 17 | 18 | 100% |
| WebKit mobile emulation | Pan | 20 | 17 | 17 | 100% |
| WebKit mobile emulation | Zoom | 20 | 17 | 18 | 100% |

The timing harness dispatches automated pointer and wheel events; these results do not include physical touch sampling, mobile thermal behavior, or browser chrome latency. Browser tests additionally covered a read waiting for an active stroke, an empty duplicated tab taking over after coordinator close, a simulated restored checkpoint with no sibling opening blank, and storage quota rejection preserving earlier ink.

## Remaining outcome gates

The user requested automatic simulated tests and no physical test participation. Native browser-menu Restore Closed Tab, physical iPhone Safari gesture/LAN/performance checks, and a changed whole-drawing voice read through a live ChatGPT conversation were not run. The ten prepared sketch discussions and paired live-canvas versus screenshot conversations in SC-006/SC-008 were also not run; controlled MCP tests cannot establish those AI interpretation or comparative outcome claims. No physical-device, live-voice, or participant-usability claim is made.

In `tasks.md`, T003 and T041–T044/T046 remain unchecked because they explicitly require physical-device, native browser-menu, or live ChatGPT checks. The automated performance harness covers the desktop and simulated WebKit portions of T041/T042. T045 is complete for all six automated gates.
