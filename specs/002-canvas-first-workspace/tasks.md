# Tasks: Canvas-First Open Workspace

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [canvas session contract](contracts/canvas-session.md), and [quickstart.md](quickstart.md).

**Tests**: Required by Constitution Principle V. For every covered behavior below, write the behavioral test, run it, and observe the intended failure before changing production behavior. Record red and green evidence in `specs/002-canvas-first-workspace/test-evidence.md`.

**Organization**: Tasks are grouped by user story. `[P]` marks genuinely independent work in different files. All paths are repository-relative.

## Phase 1: Setup

**Purpose**: Prepare this existing Next.js and broker package for test-first changes.

- [ ] T001 Restore pinned dependencies with `pnpm install --frozen-lockfile`; read the relevant local Next.js client-component and route-handler guides under `node_modules/next/dist/docs/` before editing source; record the guides consulted in `specs/002-canvas-first-workspace/test-evidence.md`.
- [ ] T002 Run the current unit, contract, browser, typecheck, and lint baseline and record actual results and known old-flow failures in `specs/002-canvas-first-workspace/test-evidence.md`.

---

## Phase 2: Foundational

**Purpose**: Add shared deterministic fixtures without changing product behavior. Both tasks follow Phase 1 and may run in parallel.

- [ ] T003 [P] Add a 500-stroke, 50–100-point-per-stroke fixture spread across five starting views, plus empty and far-apart drawings, in `tests/fixtures/workloads.ts`.
- [ ] T004 [P] Extend `tests/browser/fixture.ts` and `tests/browser/helpers.ts` with isolated broker startup, duplicate-tab, reload, and controlled connection-outage helpers; keep screenshot, trace, video, image-byte, and credential persistence disabled.

**Checkpoint**: Shared fixtures are ready; no application behavior has changed.

---

## Phase 3: User Story 1 — Start Drawing Immediately (P1)

**Goal**: Open directly to an unbounded drawing, keep 50 Undo steps, restore after reload, and synchronize duplicated tabs.

**Independent Test**: Open a fresh canvas, draw outside the starting view, Undo 50 of 51 strokes, reload, duplicate the tab, and confirm both tabs show the same latest drawing and history without a broker-dependent drawing path.

### Tests first

- [ ] T005 [US1] Add and run failing world-coordinate, one-stroke-per-action, 50-step eviction, and Redo-clear tests in `tests/unit/drawing-state.test.ts` and `tests/unit/drawing-history.test.ts`; ensure evicted history leaves older ink visible.
- [ ] T006 [US1] Add and run failing checkpoint, duplicate-tab action ordering, join-latest, coordinator failover, and storage-quota tests in `tests/unit/session-document.test.ts`; a rejected checkpoint must preserve earlier work and identify the unsaved stroke.
- [ ] T007 [US1] Add and run failing direct-open, offscreen drawing, same-tab reload, duplicate-tab sync, and broker-outage browser journeys in `tests/browser/canvas-session.spec.ts`.

### Implementation

- [ ] T008 [US1] Replace fixed page limits and selection-only stroke types with finite world-coordinate Stroke and Drawing Document types in `src/lib/contracts/sketch.ts` and `src/lib/drawing/state.ts`; preserve the existing per-stroke safety limit without clipping world positions.
- [ ] T009 [US1] Implement 50-step shared Undo/Redo behavior in `src/lib/drawing/history.ts`; each committed stroke is one step, a new stroke clears Redo, and older visible ink survives history eviction.
- [ ] T010 [US1] Render world-coordinate strokes in the visible area at device pixel ratio in `src/lib/drawing/render.ts`; keep provisional ink separate from committed strokes.
- [ ] T011 [US1] Implement validated tab-session checkpoints, `BroadcastChannel` join/state/action messages, Web Locks coordinator election, revision/idempotency checks, and storage-quota rejection in `src/lib/session-document.ts`; tab viewport state stays local.
- [ ] T012 [US1] Replace the welcome/start gate with an immediately usable canvas and wire drawing/history to the shared document in `src/components/SketchCanvas.tsx` and `src/app/page.tsx`.
- [ ] T013 [US1] Re-run the US1 unit and browser tests, record intended red-to-green results in `specs/002-canvas-first-workspace/test-evidence.md`, and correct only regressions found in `src/lib/drawing/` or `src/lib/session-document.ts`.

**Checkpoint**: US1 works as a drawing app without the AI connection. Reload and duplicate-tab behavior are independently testable.

---

## Phase 4: User Story 2 — Navigate Without Accidental Ink (P1)

**Goal**: Pan and zoom the open canvas with desktop and touch gestures while preserving drawing/history.

**Independent Test**: Draw in several world locations, use wheel and trackpad pinch, Space drag, hand drag, two-finger pan, and touch pinch; return to prior marks with no stray stroke or history entry.

### Tests first

- [ ] T014 [US2] Add and run failing pointer-centered zoom, pan transform, finite zoom bounds, and viewport/history separation tests in `tests/unit/viewport.test.ts`.
- [ ] T015 [US2] Add and run failing single-touch pen, second-finger cancellation, two-finger pan/pinch, pointer-cancel, Space-drag, and hand-mode tests in `tests/unit/gesture-state.test.ts`.
- [ ] T016 [US2] Add and run failing Chromium desktop and WebKit touch navigation journeys in `tests/browser/canvas-navigation.spec.ts`, including no committed partial stroke after a second finger lands.

### Implementation

- [ ] T017 [US2] Add per-tab viewport math for screen/world conversion, cursor-anchored wheel zoom, midpoint-anchored pinch zoom, and pan in `src/lib/drawing/viewport.ts`.
- [ ] T018 [US2] Add a pointer-ID gesture state machine that cancels provisional ink before touch navigation and ignores navigation in Undo history in `src/lib/drawing/gestures.ts`.
- [ ] T019 [US2] Wire wheel, keyboard Space, pointer capture/cancel, pen, hand, and two-touch input through `src/components/SketchCanvas.tsx`; keep drawing responsive when the broker is unavailable.
- [ ] T020 [US2] Apply canvas touch ownership, viewport sizing, and pointer-mode cursor rules in `src/app/globals.css`; keep the toolbar outside the gesture surface.
- [ ] T021 [US2] Re-run US2 unit/browser tests and record red-to-green results in `specs/002-canvas-first-workspace/test-evidence.md`.

**Checkpoint**: US2 navigation is usable with the existing basic controls and is independently verified without an AI request.

---

## Phase 5: User Story 3 — Ask ChatGPT About the Latest Drawing (P1)

**Goal**: Automatically make one live canvas session available to the configured local helper, then return a fresh, complete, read-only whole-drawing image only on request.

**Independent Test**: Draw far-apart marks, ask the helper to read, edit and read again, then exercise empty, ambiguous, unreadable, expired, interrupted, and broker-restart cases; no old or unrelated image is delivered.

### Tests first

- [ ] T022 [US3] Add and run failing automatic session registration, duplicate-tab single-target, distinct-session ambiguity, lease expiry, and broker-restart tests in `tests/contract/session-access.test.ts` and `tests/contract/local-client.test.ts`.
- [ ] T023 [US3] Add and run failing whole-stroke-bounds, padding, 1.5-output-pixel legibility, empty drawing, immutable revision, and active-gesture deadline tests in `tests/unit/capture-recovery.test.ts`.
- [ ] T024 [US3] Add and run failing MCP tool-name, image/metadata, typed error, PNG validation, and no-write-path tests in `tests/contract/sketch-read.test.ts`, `tests/contract/snapshot-provenance.test.ts`, and `tests/contract/mcp-protocol.test.ts`.
- [ ] T025 [US3] Add and run failing on-demand read, no Connect control, outage continuity, stale-key rejection, and duplicated-tab snapshot journeys in `tests/browser/connection-recovery.spec.ts` and `tests/browser/canvas-read.spec.ts`.

### Implementation

- [ ] T026 [P] [US3] Extend broker Canvas Session records with per-tab presence, generation-bound read grants, final-tab/lease revocation, and distinct-session ambiguity in `src/broker/sessions.ts` and `src/broker/local-client.ts`; keep helper bootstrap separate from browser owner authority.
- [ ] T027 [P] [US3] Replace selection crop with padded whole-stroke capture and a `CAPTURE_UNREADABLE` failure below 1.5 output pixels in `src/lib/drawing/capture.ts` and `src/lib/drawing/render.ts`; freeze one acknowledged drawing revision before encoding.
- [ ] T028 [US3] Auto-register/recover the canvas session and use one coordinated capture provider without returning a read capability to the page in `src/lib/session-client.ts` and `src/components/SketchCanvas.tsx`; do not send images on an idle timer.
- [ ] T029 [US3] Adapt session, heartbeat, capture, and error routes for per-tab presence and automatic grants in `src/broker/server.ts` and `src/app/api/sketch/[...path]/route.ts`; preserve same-origin/loopback checks and body limits.
- [ ] T030 [US3] Validate current session generation, full-drawing snapshot metadata, PNG size/dimensions, one pending request, and revocation before delivery in `src/broker/captures.ts` and `src/lib/contracts/sketch.ts`; never substitute an earlier image.
- [ ] T031 [US3] Expose only the read-only `read_current_drawing` MCP tool with fresh metadata and distinct `NO_DRAWING`, `AMBIGUOUS_CANVAS`, `CAPTURE_TIMEOUT`, `CAPTURE_UNREADABLE`, `PAYLOAD_TOO_LARGE`, `BUSY`, and `SESSION_UNAVAILABLE` results in `src/broker/mcp.ts`.
- [ ] T032 [US3] Re-run US3 unit, contract, and browser tests; record red-to-green results and image/privacy observations in `specs/002-canvas-first-workspace/test-evidence.md`.

**Checkpoint**: The complete draw–navigate–ask workflow works in controlled text/MCP tests. Voice support is claimed only after the final capability gate.

---

## Phase 6: User Story 4 — Use a Minimal, Consistent Toolbar (P2)

**Goal**: Present the same four compact icon controls at the bottom center of desktop and phone while keeping labels and sharing scope discoverable.

**Independent Test**: Compare desktop and phone layouts; use pen, hand, Undo, and Redo with pointer, keyboard, touch hold, and screen reader; find no landing, Discuss, Connect, or persistent AI status in the normal workspace.

### Tests first

- [ ] T033 [US4] Add and run failing toolbar order, selected/disabled state, focus/Enter/Space activation, touch-hold label suppression, and no-extra-panel tests in `tests/browser/accessibility.spec.ts` and `tests/browser/canvas-toolbar.spec.ts`.

### Implementation

- [ ] T034 [US4] Replace the existing text-heavy controls with icon-only pen, hand, Undo, and Redo buttons; add hover/focus labels and touch press-and-hold labels that do not activate in `src/components/DrawingToolbar.tsx`.
- [ ] T035 [US4] Remove selection preview, manual connection controls, in-app discussion/status copy, and old branding from the normal canvas layout in `src/components/SketchCanvas.tsx`; provide a discoverable, nonpersistent explanation of whole-drawing AI access and delivered-image retention.
- [ ] T036 [US4] Implement matching bottom-centered desktop and mobile toolbar layout, cream/green/serif styling, safe-area spacing, and focus visibility in `src/app/globals.css`.
- [ ] T037 [US4] Re-run the US4 browser/accessibility tests and record red-to-green results in `specs/002-canvas-first-workspace/test-evidence.md`.

**Checkpoint**: All four story flows use the final simplified interface.

---

## Phase 7: Polish and Cross-Cutting Validation

**Purpose**: Prove the integrated user outcome and update operational guidance.

- [ ] T038 Update local startup, automatic read flow, reload/duplicate-tab behavior, 50-step Undo limit, error guidance, and transient-data wording in `README.md`.
- [ ] T039 Run the 500-stroke interaction measurement and storage-quota/revocation cases from `specs/002-canvas-first-workspace/quickstart.md`; record device, actual counts, latency distribution, and failures in `specs/002-canvas-first-workspace/test-evidence.md`.
- [ ] T040 Run the physical iPhone Safari gesture, duplicate/reload, and local-LAN read walkthrough from `specs/002-canvas-first-workspace/quickstart.md`; record the actual device arrangement and results in `specs/002-canvas-first-workspace/test-evidence.md`.
- [ ] T041 Repeat the changed whole-drawing voice capability check using `specs/001-discuss-diagram/feasibility.md`; record whether ChatGPT voice read the current canvas and gave a relevant spoken answer in `specs/002-canvas-first-workspace/test-evidence.md`; if unsupported, stop the spoken-scope claim and return the finding to the user.
- [ ] T042 Run `pnpm run test:unit`, `pnpm run test:contract`, `pnpm run test:browser`, `pnpm run typecheck`, `pnpm run lint`, and `pnpm run build`; record exact results and known limits in `specs/002-canvas-first-workspace/test-evidence.md`.
- [ ] T043 Conduct the five-person drawing walkthrough and ten prepared sketch discussions required by SC-001, SC-002, and SC-006; record observed counts and the two-elements/one-ambiguous-mark scoring in `specs/002-canvas-first-workspace/test-evidence.md` rather than inferring a pass.

---

## Dependencies and Execution Order

- Phase 1 precedes Phase 2; Phase 2 fixtures precede story tests.
- US1 supplies the shared Drawing Document and direct canvas. US2 and US3 build on it; US4 finalizes the controls used by both. Work on US2 and US3 may overlap after US1, but shared `SketchCanvas.tsx` edits must be coordinated.
- Within every story, its failing behavioral tests precede its covered implementation; green re-runs and evidence follow it.
- Phase 7 follows all story checkpoints. The constitution's useful MVP is the complete US1 → US2 → US3 draw–navigate–ask path; US4 finishes the visual simplification required for the full feature.
- The custom `checklists/canvas-review.md` is reviewer-owned and remains unchecked after generation. Its markers are not implementation progress; review any unresolved requirement-quality finding before implementation gates that require it.

### Parallel opportunities

- T003 and T004 are independent fixture/harness work in different files.
- After US3 tests are red, T026 broker session/access work and T027 drawing capture work are independent; T028–T031 integrate them sequentially.
- Test writing for distinct stories can be prepared independently after Phase 2, but production edits to shared files and story checkpoints follow the dependency order above.

### Parallel examples

| Story | Independent preparation | Merge point |
| --- | --- | --- |
| US1 | World/history tests in `tests/unit/drawing-state.test.ts` and `tests/unit/drawing-history.test.ts`; recovery tests in `tests/unit/session-document.test.ts` | Shared document wiring in `src/components/SketchCanvas.tsx` |
| US2 | Viewport tests in `tests/unit/viewport.test.ts`; gesture tests in `tests/unit/gesture-state.test.ts` | Pointer wiring in `src/components/SketchCanvas.tsx` |
| US3 | Broker contract tests in `tests/contract/session-access.test.ts`; capture tests in `tests/unit/capture-recovery.test.ts` | Capture delivery through `src/lib/session-client.ts` and `src/broker/server.ts` |
| US4 | Toolbar accessibility test in `tests/browser/accessibility.spec.ts`; layout inspection against Figma | Final `DrawingToolbar.tsx` and `globals.css` integration |

## Implementation Strategy

1. Build and independently verify US1 direct drawing/recovery, then US2 navigation, then US3 on-demand read. This completes the constitution-required end-to-end path.
2. Apply US4's final compact UI and re-run the integrated journey. Keep visual comparison separate from behavior tests, while retaining accessible interaction tests.
3. Complete Phase 7 with controlled checks first, then physical-device and participant results. Record actual failures and passing results; do not claim unrun gates passed.
4. Do not add image segmentation, new cloud services, in-app chat, or AI canvas edits without a demonstrated gap and a separate specification.
