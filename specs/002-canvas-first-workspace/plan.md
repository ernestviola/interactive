# Implementation Plan: Canvas-First Open Workspace

**Branch**: `002-canvas-first-workspace` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

**Input**: Clarified feature specification, approved Interactive Constitution v3.0.0, and the [Figma canvas-first concept](https://www.figma.com/design/aIalohp0XclbOEWbNv3QYh?node-id=4-2).

## Summary

Open interactive directly on an open-ended drawing surface with a four-icon, bottom-centered toolbar. World-coordinate strokes and a per-tab viewport support pen drawing, mouse-wheel and pinch zoom, and hand/two-finger pan without accidental ink. Retain 50 Undo steps. Reloading restores a tab's session; duplicated tabs share one live drawing. The existing local broker automatically makes the active canvas readable by the configured ChatGPT helper, which captures every committed stroke in one padded image only when asked. Preserve read-only AI access, transient data, clear failures, and drawing during connection outages.

## Technical Context

**Language/Version**: TypeScript 6, React 19, Next.js 16.4.5, Node 24.22.1, pnpm 12.15.0, Python 3 for repository guards.

**Primary Dependencies**: Existing Next.js App Router, MCP SDK, Zod, browser Canvas/Pointer Events, `sessionStorage`, `BroadcastChannel`, and Web Locks. Add no canvas framework or cloud service.

**Storage**: Session-scoped browser checkpoints for strokes and 50-step history; in-memory broker sessions, leases, capabilities, and pending image bytes. No database or durable image store. Checkpoint size must be bounded and validated before acknowledging a new stroke.

**Testing**: Vitest unit and contract suites; Playwright Chromium and WebKit browser suites; physical iPhone Safari and desktop gesture walkthrough; controlled MCP/voice capability check. No live provider in routine tests.

**Target Platform**: Current desktop Chrome/Chromium and Safari/WebKit; iPhone Safari for touch. Existing Next.js web app and local loopback broker. GCP remains the designated future cloud platform under the earlier [local-hosting decision](../001-discuss-diagram/planning-inputs.md); deployment is outside this feature.

**Project Type**: Single Next.js web application plus its existing local Node broker/MCP helper.

**Performance Goals**: Meet spec SC-005: at least 95% of drawing, pan, and zoom interactions show feedback within 100 ms for a representative 500-stroke drawing. Read requests return a fresh complete image or typed failure before the existing broker deadline.

**Constraints**: No fixed world boundary; no required selection, Connect button, in-app chat, idle-triggered image sending, or AI write method. One PNG per successful read within existing dimension/byte limits; fail if the full drawing cannot remain legible. Session data stays transient; 50 Undo steps; source remains editable during broker outages.

**Scale/Scope**: One user's drawing per canvas session, possibly viewed through duplicated tabs. The existing 1,000-stroke upper bound is a starting safety cap, subject to checkpoint-size validation. No new drawing or image database.

## Constitution Check

*GATE: evaluated before research and again after Phase 1 design.*

| Principle or constraint | Pre-research | Post-design | Evidence |
| --- | --- | --- | --- |
| I. Smallest useful workflow | PASS | PASS | Direct draw, navigate, ask flow; no speculative segmentation or new cloud service |
| II. Ground conversation in canvas | PASS | PASS | One immutable whole-drawing revision; no stale, viewport-only, or partial image fallback |
| III. Keep users in control | PASS | PASS | Browser remains drawable offline; broker read grant is session-scoped; MCP has no write path |
| IV. Understandable AI claims | PASS | PASS | Tool metadata says sketch is design context, not verified implementation; sharing scope is discoverable |
| V. TDD and outcome validation | PASS | PASS | Tests precede covered behavior; controlled MCP checks, browser gestures, physical iPhone walkthrough |
| Next.js and GCP | PASS | PASS | Existing Next.js retained; no GCP provisioning in this locally hosted slice under prior user direction |
| Voice capability gate | PASS | PASS | Prior physical-device feasibility is documented; recheck the changed whole-drawing tool before claiming new voice behavior |

No constitution violation is proposed. The browser's page-close event is not a reliable revocation signal, so broker lease expiry is mandatory. A browser crash may restore tab-scoped storage; a restored page must reauthorize under a new live broker generation rather than reuse expired AI access.

## Project Structure

### Documentation (this feature)

```text
specs/002-canvas-first-workspace/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/canvas-session.md
└── quickstart.md
```

### Source Code (repository root)

```text
src/
├── app/page.tsx                         # existing direct entry
├── app/globals.css                      # canvas and toolbar layout
├── app/api/sketch/[...path]/route.ts    # existing local broker proxy
├── components/SketchCanvas.tsx          # direct canvas and gesture wiring
├── components/DrawingToolbar.tsx        # four icon controls
├── lib/contracts/sketch.ts              # shared session/snapshot types
├── lib/drawing/{state,history,render,capture}.ts
├── lib/session-client.ts                # browser-to-broker lifecycle
├── lib/session-document.ts              # planned tab checkpoint and action ordering
└── broker/{sessions,local-client,captures,mcp,server}.ts
tests/
├── unit/                                # world transforms, gestures, history, checkpoint
├── contract/                            # broker access, snapshot validation, MCP failures
└── browser/                             # desktop, touch, reload, duplicate, outage
```

**Structure Decision**: Extend the existing single package. Keep pure drawing logic in `src/lib/drawing`, browser session coordination in `src/lib`, and authorization/capture delivery in `src/broker`. The prospective `session-document.ts` is a logical module name; tasks may split it only if the implementation requires it.

## Phase 0: Research Decisions

[research.md](research.md) records the selected world-coordinate rendering, gesture state machine, tab-session recovery, cross-tab sequencing, 50-step history, automatic broker read grant, one-image capture, validation approach, and rejected alternatives. No unresolved technical question remains.

## Phase 1: Design and Contracts

- [data-model.md](data-model.md) defines the transient canvas session, shared document, action history, per-tab viewport, read grant, and immutable snapshot.
- [contracts/canvas-session.md](contracts/canvas-session.md) defines tab synchronization, broker/MCP read behavior, error outcomes, and revocation.
- [quickstart.md](quickstart.md) gives runnable checks and expected results without implementation code.

### Implementation approach

1. Replace fixed-page coordinates and selection state with world-coordinate strokes and a viewport transform. The pen's provisional stroke is discarded when a second touch changes the gesture to navigation.
2. Preserve the existing history functions conceptually, cap the shared Undo stack at 50 actions, and keep old ink after history eviction. Treat reload and duplicate-tab recovery as part of the same document lifecycle.
3. Keep the browser's acknowledged drawing as the capture source. Session-scoped checkpoints enable reload; a cross-tab coordinator orders drawing actions and supplies the latest revision to the capture tab. On coordination uncertainty, AI reads fail safely while local drawing remains usable.
4. Adapt the broker to register a live canvas automatically and grant only the configured helper read access. Resolve one session, not one tab. Distinct active sessions produce an ambiguity error. Revoke on explicit final close or lease expiry; generations reject late images.
5. Replace selected-region capture with padded whole-stroke bounds. Freeze one revision, fit within image limits only while legible, validate PNG and metadata, and discard bytes after delivery.
6. Build the compact UI from the Figma reference. Keep labels available through hover/focus and touch press-and-hold, expose applicable selected/disabled states, and keep sharing explanations accessible without permanent canvas copy.

### Validation order

Write failing behavioral tests before changing drawing state, gesture transitions, history, session recovery/sync, broker authorization, and capture. Then implement the smallest passing change for each path. Use manual visual inspection for layout, followed by browser accessibility and physical-device gesture checks. Run the changed whole-drawing MCP read through the documented voice-capability check before claiming spoken support.

## Risks and limits to verify

- Session storage quota may vary. A stroke must not be acknowledged unless the updated checkpoint can be written; test the 500-stroke workload and quota failure.
- Browser duplication and background-tab scheduling differ. Verify join, coordinator handoff, reload, final-tab close, and broker restart on supported browsers.
- One image can lose detail when strokes are far apart. Return `CAPTURE_UNREADABLE` at a measured legibility threshold rather than silently shrinking the drawing beyond use.
- `pagehide` is best effort. The broker lease must revoke reads when a close event is missed, including mobile browser termination.
