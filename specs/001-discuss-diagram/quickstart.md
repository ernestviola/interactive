# Quickstart Validation Guide

Planning artifact only. No package.json, runnable server, tests, or UI exists yet. Commands
below define the intended implementation's scripts and expected results; they have NOT run.
Do not install packages, register an MCP connection, or implement code under this planning task.

## Stage 1: Verify the desktop-local capability

Follow [feasibility.md](feasibility.md) before building the product. The initial target is a
local task in the ChatGPT desktop app with live voice enabled, not hosted ChatGPT web.
Use controlled non-sensitive images first and a minimal live selection capture second.
No runtime pass is currently recorded.

Read the official [voice](https://learn.chatgpt.com/docs/features/voice),
[MCP configuration](https://learn.chatgpt.com/docs/extend/mcp), and
[image-input](https://learn.chatgpt.com/docs/image-inputs) docs. Local MCP configuration and
live voice availability depend on the actual app, task host, rollout, plan, and workspace.
No separate app account is required; ChatGPT's own account requirements still apply.

## Stage 2: Intended local run after implementation is separately authorized

Prerequisites: compatible Node.js 24 LTS toolchain; locked Next.js/React/MCP SDK dependencies;
a desktop voice-capable client; physical iPhone 12 Safari and trusted local network for phone testing.
Provision Node.js 24 LTS and a compatible pnpm release during implementation. Pin the exact
pnpm version in package.json via its packageManager field; no toolchain is installed by this guide.

From repository root, planned scripts are:

```bash
pnpm install --frozen-lockfile
pnpm run test:unit
pnpm run test:contract
pnpm run dev
pnpm run test:browser
pnpm run build
```

`dev` must launch Next.js at port 3000 and the local broker at port 3001. A production-like
local check must also run the built web app with that same broker to avoid relying on dev
behavior. Package scripts and process supervision are implementation deliverables, not files
created by this guide. Browser tests require their normal Playwright runtime dependencies.

Commit pnpm-lock.yaml as the sole dependency lockfile; do not create package-lock.json.
Use pnpm for all dependency changes and scripts.

Routine tests must use controlled MCP clients and responses, not a live paid AI service.
For TDD-covered behavior, first run the relevant behavioral test and observe its intended
failure, implement only that behavior, then run green and refactor. Record both results.

## Stage 3: Pair the local desktop task

1. Open the web app at `http://localhost:3000`, acknowledge session-only data handling, draw,
   select a region, and verify the exact preview.
2. Use Connect to generate a per-session read capability. Keep it out of chat and screenshots.
3. Place that capability in the desktop task host's environment as `SKETCH_READ_TOKEN`.
   Configure the local desktop MCP server URL as `http://127.0.0.1:3001/mcp` and its
   `bearer_token_env_var` as `SKETCH_READ_TOKEN`, using the official desktop MCP settings.
   Do not commit a token or configure only a different sandbox/remote host by mistake.
4. Restart/reconnect the MCP connection so the host reads the environment. Confirm the tool
   appears, then inspect it with MCP Inspector using the same read-only capability.
5. Start actual live voice in that local task and request the current selected sketch.
   Confirm the returned snapshot ID/read time and an image-grounded spoken answer.
6. Change the drawing; request another read in the same voice conversation. Verify new visual
   content, not a recollection of the earlier image. Do not count dictation or text-to-speech
   layered on a text chat as a live voice pass.

## Stage 4: iPhone drawing with desktop voice

- Serve the web app on an interface reachable from the trusted LAN. On an ordinary local
  machine the web server listens on 0.0.0.0:3000 and iPhone opens the host's LAN IP/hostname.
  The desktop broker can remain loopback-only. Configure the explicit permitted LAN origin.
- In this sandbox, both services must bind 0.0.0.0 internally to use host publishing. The
  operator runs on the host, with the actual sandbox name:

```bash
sbx ports <sandbox-name> --publish 3000:3000
sbx ports <sandbox-name> --publish 127.0.0.1:3001:3001
```

- `localhost` on iPhone is the phone, not the desktop or sandbox. Ensure host firewall/router
  allows phone access to the UI port. The broker is host-only; never publish it broadly just
  to let the phone draw. Browser management reaches the broker through Next.js proxy routes.
- Pair the phone's sketch session explicitly; a token from an earlier desktop canvas does not
  automatically follow. Speak through ChatGPT on the computer while drawing on iPhone.
- Test finger drawing, mode switching, page scrolling outside the canvas, orientation changes,
  pointer cancellation, and background/resume. A backgrounded session may expire after 20s;
  local ink should remain if the tab survives, but pairing must be renewed explicitly.

## Acceptance walkthrough

| Scenario | Expected result |
| --- | --- |
| Draw and undo/redo on desktop and iPhone | Visible ink and stable history; no drawing-induced page scroll |
| Rectangle crossing marks | Exact preview/image clipping; no outside ink or UI |
| Edit while PNG is encoding | Earlier snapshot stays fixed; editing remains usable |
| Empty or absent selection | Actionable error; no full-canvas fallback |
| Two different sessions | Tokens never cross session boundaries |
| End, rotate pairing, expire lease | Pending and future reads fail; no cached image fallback |
| Slow, late, or duplicate response | Bounded failure; cannot fulfill a different read |
| AI unavailable | Ink, selection, and undo/redo remain usable |
| Completed read | Last-sent snapshot ID/capture time updates without claiming AI comprehension |
| Reload or close | Warned session loss; old pairing invalidates by end/lease expiry |

Measure p95 pointer-to-visible feedback at 500 strokes of up to 1,000 points each on both
physical device types. Run the five-user pilot and ten-question response review specified
by SC-001, SC-005, and SC-006 using [validation.md](validation.md). These product targets have not been achieved by documentation.

## Definition of readiness

- Record SC-007 controlled-image and live selected-canvas evidence, including actual client
  and device arrangement. Unsupported voice returns to the user for scope, not a silent fallback.
- All automated tests/build checks pass; real iPhone and desktop walkthroughs pass.
- Fail-first records exist for covered behavior; no image or capability is present in logs,
  caches, persisted storage, or test artifacts.
- No GCP provisioning, public plugin publishing, embedded voice, or app account implementation
  is needed for this local prototype.

## Agreed device baseline

macOS Chromium, macOS Safari, and physical iPhone 12 Safari are separate acceptance targets.
Follow validation.md for baseline recording, presentation-latency measurement, and pilot
scoring. No Mac hardware, OS version, or performance result is assumed by this guide.
