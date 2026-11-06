# Quickstart Validation: Canvas-First Open Workspace

Use this guide after implementation. It validates the behavior in [spec.md](spec.md) through the [canvas session contract](contracts/canvas-session.md). The previous selected-region tests must be updated before the full suite is expected to pass.

## Prerequisites

- The feature branch is checked out, Git guards are installed, and the configured local MCP helper is available for the on-demand read scenario.
- Node and pnpm versions from `package.json` are available. Install dependencies with `pnpm install --frozen-lockfile`.
- Before changing Next.js code, read the relevant versioned guides in `node_modules/next/dist/docs/`, per `AGENTS.md`.
- For physical-device checks, an iPhone running Safari can reach the local web app by the trusted LAN origin described in `README.md`. The broker remains loopback-only on the Mac.

## Automated checks

Run focused checks as behavior is added, then the full local gate:

```sh
pnpm run test:unit
pnpm run test:contract
pnpm run test:browser
pnpm run typecheck
pnpm run lint
pnpm run build
```

The covered state, recovery, access, and capture changes require a recorded failing behavioral test before each implementation change, then a passing result. Test runs must not save PNGs, secrets, screenshots, traces, or videos to the repository.

## End-to-end walkthrough

Start the local app with `pnpm run dev`. Open the canvas in desktop Chrome or Safari, then repeat touch cases on physical iPhone Safari.

| Scenario | Action | Expected result |
| --- | --- | --- |
| Direct start | Open the app | Canvas is ready immediately; no welcome or Connect action |
| Open space | Draw, pan away, draw again, return | Both strokes remain in the same world positions; no page edge |
| Desktop navigation | Wheel/pinch around a point, Space drag, hand drag | Zoom anchors correctly; pan makes no stroke or Undo entry |
| Touch navigation | Draw with one finger; add second finger; pan/pinch; use hand | No partial ink from transition; one-finger hand pans |
| Toolbar | Hover, keyboard focus/activation, screen reader, touch press-and-hold | Four bottom-centered icons have usable names and state; holding reveals a label without activating |
| History | Draw 51 strokes; Undo repeatedly; Redo; draw again | Exactly 50 recent strokes are undoable; older ink remains; new stroke clears Redo |
| Reload | Draw, undo once, reload the same tab | Drawing and 50-step history return; current view can continue |
| Duplicate | Duplicate tab; draw and Undo in each | Both show one synchronized drawing/history; neither requires manual sync |
| Read | Ask configured ChatGPT helper to read | One padded PNG includes every committed stroke from one revision, with fresh metadata |
| Re-read | Edit, ask again | New image reflects edit; earlier delivered image remains unchanged |
| Empty/ambiguous | Read empty drawing; open distinct drawings and read | Distinct actionable errors; no stale or wrong image |
| Outage | Stop broker while drawing; restore it | Drawing continues, session recovers, no old grant can read after revocation |
| Final close | Close last tab; wait for lease expiry if needed | Future reads fail; app-managed image bytes are not retained |

For read accuracy, place strokes far apart and near opposite edges of the drawn content. Verify all are in the image with their relative layout preserved. Also test a spread that would make one image unreadable and confirm `CAPTURE_UNREADABLE` rather than a misleading partial image. Test a full checkpoint quota separately: the rejected new stroke is clearly reported while previously committed work remains.

## Outcome gates

- Measure the specified 500-stroke workload against SC-005: at least 95% of drawing, pan, and zoom interactions show visible feedback within 100 ms on supported desktop and iPhone devices.
- Run the five-person usability walkthrough in SC-001/SC-002 and the ten prepared sketch discussions in SC-006. Preidentify two visible elements and one ambiguous mark in each discussion, then record actual counts, not inferred passes.
- Repeat the prior physical voice capability procedure from [feasibility.md](../001-discuss-diagram/feasibility.md) against the new whole-drawing tool before claiming spoken reads work. Record device arrangement and the actual result.
- Record known browser session-restore and image legibility limits in the change summary. If a required gate fails, fix it or return to the user with the specific unresolved behavior.
