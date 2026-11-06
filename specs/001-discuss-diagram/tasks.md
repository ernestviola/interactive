# Tasks: Discuss a Freehand Sketch

**Input**: Design documents from `specs/001-discuss-diagram/`.
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, feasibility.md,
quickstart.md, validation.md, and constitution v2.0.0.
**Tests**: Required by the user's TDD decision and constitution V. Record the intended
behavioral failure before implementation, then passing result and refactor evidence.
**Organization**: Setup → controlled-image foundation → US1 → US2/US3 → cross-cutting acceptance.
**Status**: T001–T042 have recorded completion/disposition, including explicit waivers for T039/T040. Gate A and Gate B passed actual live voice. Phase 7 convergence findings T043–T045 are implemented and verified; all 45 task dispositions are complete.

## Format: `[ID] [P?] [Story] Description`

`[P]` permits parallel work only after listed prerequisites are satisfied and only on distinct
files. It does not permit implementing behavior before its failing tests or bypassing gates.
Story phases use [US1], [US2], [US3]; setup/foundation/polish have no story labels.

## Path Conventions

Single TypeScript package: `src/app/`, `src/components/`, `src/lib/`, `src/broker/`, `tests/`.
Disposable early experiment: `experiments/voice-mcp/`. Evidence: `specs/001-discuss-diagram/`.
No database, durable image store, app accounts, embedded speech, public MCP publishing, or
GCP deployment is included. Only a separately authorized implementation run may execute tasks.

## Phase 1: Setup (Experiment Tooling Only)

**Purpose**: Prepare only the disposable feasibility experiment. No canvas product or cloud
provisioning yet. These are future implementation tasks, not actions performed by generation.

- [X] T001 Establish Node.js 24 LTS and a compatible pnpm release on the execution host and record versions plus actual macOS/ChatGPT voice availability in specs/001-discuss-diagram/feasibility.md; distinguish the desktop task host from this sandbox and do not claim account access from CLI access.
- [X] T002 Initialize minimal experiment scripts and pinned TypeScript 7.0.2, tsx 4.23.15, MCP SDK 1.32.2, Zod 4.6.7, and Vitest 5.1.0 in package.json, pnpm-lock.yaml, and tsconfig.json; pin the exact pnpm release in package.json packageManager and use pnpm exclusively (no package-lock.json); validate manifest/compiler compatibility and record justified adjustments in specs/001-discuss-diagram/research.md without adding the product app yet.
- [X] T003 Configure unit/contract test scripts in package.json and vitest.config.ts and a metadata-only red/green evidence record at specs/001-discuss-diagram/test-evidence.md; exclude credentials, image bodies, and response payloads from logs and generated test artifacts.

---

## Phase 2: Foundational (Controlled-Image Feasibility Gate A)

**Purpose**: Establish the blocking client capability before any user-story implementation.
**Independent experiment**: One actual desktop live-voice conversation correctly identifies
an image and a changed image via two fresh tool calls, without answers leaked in metadata.
T004 must fail for the intended behavioral reasons before T005. Gate A is T006.

- [X] T004 Write and run failing tests in tests/contract/voice-fixture.test.ts for empty-object-only input, actual PNG content, distinct snapshot identities/timestamps on repeated reads, read-only state, invalid capability rejection, bounded failure, and no image answer in text metadata; record intended failures in specs/001-discuss-diagram/test-evidence.md.
- [X] T005 Implement only the disposable read_selected_sketch experiment in experiments/voice-mcp/server.ts and experiments/voice-mcp/fixture.ts: local Streamable HTTP, out-of-band random read capability, in-memory changing synthetic PNG, image/png content plus opaque identity/capture time, no image files/logs/cache; make T004 green and document startup in specs/001-discuss-diagram/feasibility.md.
- [X] T006 Run Inspector, text baseline, actual live voice, changed second image, and disconnection scenarios from specs/001-discuss-diagram/feasibility.md; record real call IDs/times/client/device and spoken interpretations there. GATE A: proceed only on observed voice+fresh-image success; unsupported returns scope to the user, unavailable is BLOCKED, and neither is a pass.

---

## Phase 3: User Story 1 — Discuss a Freehand Sketch (Priority: P1, MVP)

**Goal**: Draw, select, discuss through desktop voice, and revise manually without exports.
**Entry dependency**: T006 PASS, not merely completed documentation.
**Independent test**: Start empty on macOS Chromium/Safari or iPhone 12 Safari, draw a three-step
flow, select a rectangle, ask aloud, obtain an image-grounded spoken answer, revise manually.

### Minimal live-canvas feasibility slice

T007–T017 are restricted to what is needed to prove a protected live selected-image read.
They do not authorize the remaining product work until Gate B passes. Every red task precedes
its implementation; failures must be behavioral rather than broken test infrastructure.

- [X] T007 [US1] After Gate A, initialize the minimal Next.js 16.4.5/React 19.3.1 shell in src/app/layout.tsx and src/app/page.tsx, and scripts/configuration in package.json, next.config.ts, and playwright.config.ts; add Playwright 1.64.1 and broker supervision for ports 3000/3001, retaining pnpm-lock.yaml and using pnpm for dependency changes and scripts.
- [X] T008 [P] [US1] Write and run failing model tests in tests/unit/drawing-state.test.ts for stable stroke IDs, ordered finite {x,y} points, committed revision increments, unfinished-gesture cancellation, and one rectangular selection; quote “fixed 1024 × 768 logical units,” “Normalize reverse drags, clamp to drawing bounds, and reject zero area” in fixtures; record RED evidence.
- [X] T009 [P] [US1] Write and run failing contract tests in tests/contract/session-access.test.ts for create/pair/owner/read separation, random 256-bit capabilities, non-authorizing session IDs, no foreign-session access, Host/Origin rules, and ended-session revocation; include “active, expired, or ended,” “at most one pending request,” “5-second heartbeat,” and “20-second lease” constraints from data-model.md; record RED evidence.
- [X] T010 [US1] Implement the minimal drawing/selection model in src/lib/drawing/state.ts and shared schemas in src/lib/contracts/sketch.ts to satisfy T008: one dark constant-width pen on white, logical positions, monotonic drawing/selection revisions, normalized positive bounds, and discarded cancelled gestures; no recognition or AI edits.
- [X] T011 [US1] Implement the protected local registry and owner/read capabilities in src/broker/sessions.ts and src/broker/capabilities.ts to satisfy T009: opaque id/generation, hashed distinct random 256-bit capabilities, incremented pairingEpoch on rotation, active/expired/ended lifecycle, 5s/20s presence, and atomic end/revoke; keep only metadata and one pending request in memory.
- [X] T012 [P] [US1] Write and run failing browser tests in tests/browser/crop-privacy.spec.ts for preview/crop equality, crossing-stroke clipping, absent/blank selection, excluded UI and secrets, and frozen revisions while encoding; quote “maximum image dimensions are 1024 × 768” and “maximum encoded payload is 4 MiB”; record RED evidence.
- [X] T013 [P] [US1] Write and run failing broker/MCP contract tests in tests/contract/sketch-read.test.ts for empty inputs only, one paired session, image/png plus ID/time/revisions, all errors in contracts/mcp.md, “10 seconds from read initiation,” one pending read, no mutation/cache, and last-sent update only after successful flush; record RED evidence.
- [X] T014 [US1] Implement the minimal capture renderer in src/lib/drawing/capture.ts and src/lib/drawing/render.ts to satisfy T012: wait for gesture completion within deadline, synchronously freeze ink/selection/revisions, detached exact crop before encoding, ceil selected dimensions with no outside source pixels, white background, blank detection, 1024×768/4MiB validation, and no persistent buffers.
- [X] T015 [US1] Implement the single-process relay/MCP endpoint in src/broker/server.ts, src/broker/captures.ts, and src/broker/mcp.ts to satisfy T013: read_selected_sketch with no mutation/list/switch tools, standard image content, defined annotations/errors, matching request/session/generation/pairing epoch/deadline, current-epoch check before send, late-result rejection, and transient bytes released on terminal paths.
- [X] T016 [US1] Wire the minimal protected canvas in src/components/SketchCanvas.tsx, src/components/SelectionPreview.tsx, src/components/ConnectionControls.tsx, src/lib/session-client.ts, and src/app/api/sketch/[...path]/route.ts: Draw/Select mouse/finger input, exact preview, session-loss/sharing notices, out-of-band read-token pairing, authenticated 5s capture poll/heartbeat, no-store proxy, and no in-app chat/microphone; run T008–T013 green.
- [X] T017 [US1] Perform the minimal live selected-sketch voice experiment on macOS and iPhone 12 drawing alongside desktop voice, including a changed second capture; record actual tool calls, cropped visual interpretation, and device arrangement in specs/001-discuss-diagram/feasibility.md. GATE B: SC-007 PASS is required before T018 or any US2/US3/product polish; blocked/unsupported stops product work without fallback.
- [X] T018 [P] [US1] After Gate B, extend failing tests in tests/unit/drawing-history.test.ts for undo/redo, new accepted ink clearing redo, rejected ink preserving history, explicit discard-redo, and hard capacity: “1,000 strokes including redo history, 2,000 points per stroke, and 1,000,000 stored points”; record RED evidence before T020.
- [X] T019 [P] [US1] After Gate B, write and run failing browser tests in tests/browser/touch-workflow.spec.ts for mouse/finger draw/select, controls outside canvas remaining reachable, orientation retaining logical ink, pending-read editing, all stroke-limit recovery, and cancellation preserving prior work; record RED evidence before T021.
- [X] T020 [US1] Implement complete history/capacity behavior in src/lib/drawing/state.ts and src/lib/drawing/history.ts to make T018 green: count redo references once, reject an over-limit stroke wholly, visibly discard its unsaved preview, preserve prior selection/history, and free undone content only through warned explicit discard-redo or warned new-session end.
- [X] T021 [US1] Complete ink/history controls and phone behavior in src/components/SketchCanvas.tsx, src/components/DrawingToolbar.tsx, and src/app/globals.css to make T019 green: Draw/Select/Undo/Redo/Discard redo/End, visible accepted-vs-unsaved ink, shorter-stroke recovery, white/dark brush, fixed logical extent scaled to viewport, and touch-action suppression only on canvas.
- [X] T022 [US1] Run the US1 walkthrough with controlled responses in tests/browser/discuss-sketch.spec.ts and record macOS Chromium/Safari and real iPhone 12 observations in specs/001-discuss-diagram/test-evidence.md; verify manual revision and AI read success/failure leave drawing/history unchanged, without substituting browser emulation for Safari/iPhone evidence.

---

## Phase 4: User Story 2 — Know What the AI Can See (Priority: P2)

**Goal**: Make current eligible content and the last sent snapshot distinguishable as the
canvas evolves. Core snapshot privacy already exists in US1; this story adds clear provenance.
**Dependencies**: T017 Gate B and completed US1. No US3 dependency.
**Independent test**: With a supplied sketch and controlled MCP client, send a crop, then
change ink/selection and verify old result stability, new read freshness, and honest status.

- [X] T023 [P] [US2] Write and run failing tests in tests/contract/snapshot-provenance.test.ts for capture identity/time/revisions fixed after edits, a distinct retry capture, successful-send-only lastRead metadata, no update on aborted flush, and no recreation after session end; record RED evidence.
- [X] T024 [P] [US2] Write and run failing browser tests in tests/browser/sharing-status.spec.ts for visible current eligible crop, selected-vs-previous-snapshot distinction, “Last sent to AI client” with capture time/ID, no client-receipt/comprehension claim, and status changes during edits; record RED evidence.
- [X] T025 [US2] Implement provenance/send-completion updates in src/broker/captures.ts and src/broker/sessions.ts to satisfy T023: metadata only, no image cache, monotonic-safe lastRead update after successful flush, no stale completion overwriting newer metadata or reviving ended state.
- [X] T026 [US2] Implement readable current-preview and last-sent provenance in src/components/SharingStatus.tsx, src/components/SelectionPreview.tsx, and src/lib/session-client.ts to satisfy T024: show snapshot identity/capture time and disconnected/paired/reading states; never imply a spoken answer or model understanding.
- [X] T027 [US2] Run independent US2 supplied-sketch scenarios through tests/contract/snapshot-provenance.test.ts and tests/browser/sharing-status.spec.ts and record immutability, excluded outside marks, blank-selection guidance, and unchanged canvas state in specs/001-discuss-diagram/test-evidence.md.

---

## Phase 5: User Story 3 — Continue Drawing When the Connection Fails (Priority: P2)

**Goal**: Keep drawing through outages and recover with explicit session pairing.
**Dependencies**: US1 and T017 Gate B; US2 is not required for the recovery test itself, but
shared broker files must be edited sequentially if US2 is in progress.
**Independent test**: With a supplied sketch, stop/restart the broker, continue editing, expire
or rotate pairing, reconnect explicitly, and read only a fresh current crop with ink preserved.

- [X] T028 [P] [US3] Write and run failing fake-clock tests in tests/unit/capture-recovery.test.ts for 10s deadline, one pending read/BUSY, dropped MCP request cancellation, duplicate/late capture rejection, 5s heartbeat/20s lease expiry, and admitting-epoch invalidation during re-pair; record RED evidence.
- [X] T029 [P] [US3] Write and run failing browser tests in tests/browser/connection-recovery.spec.ts for broker outage, iPhone background/resume, warned reload loss, local ink retained in a surviving tab, explicit new pairing, current-selection retry, and no old-token automatic retargeting; record RED evidence.
- [X] T030 [P] [US3] Write and run failing contract tests in tests/contract/session-recovery.test.ts for end/expiry/restart revocation, no-image stale auth, cancellation before send, irreversible already-sent bytes, “four active sessions,” “ten creation attempts per minute,” 429/Retry-After recovery, “6 MiB request-body limit,” and mismatched/late post 409; record RED evidence.
- [X] T031 [US3] Complete timeout/cancellation and revocation paths in src/broker/captures.ts and src/broker/sessions.ts to satisfy T028: delete pending images on cancellation/failure, reject old request/generation/epoch, gate send on original valid lease/pairing, cancel on rotation/end, abort remaining transmission best effort without claiming already-sent bytes can be recalled.
- [X] T032 [US3] Implement full route validation/capacity/error mapping in src/broker/http.ts and src/app/api/sketch/[...path]/route.ts to satisfy T030: all browser operations from contracts/local-session.md, role separation, Host/Origin controls, finite revisions/ISO times/PNG validation, 6MiB body and 4MiB image limits, four sessions and ten starts/minute, safe 401/409/429, and metadata-only no-store responses.
- [X] T033 [US3] Implement reconnect/presence/end behavior in src/lib/session-client.ts and src/components/ConnectionControls.tsx to satisfy T029: 5s heartbeat, lease-aware unavailable state, explicit new pairing without losing surviving local ink, warned reload/end, shorter-selection retry, capacity guidance to end another owned session or await expiry, and rate-limit countdown from Retry-After.
- [X] T034 [US3] Run US3 contract/browser outage scenarios plus real iPhone 12 foreground/background and local restart checks in specs/001-discuss-diagram/quickstart.md; record results in specs/001-discuss-diagram/test-evidence.md and prove zero leaked images and no old read succeeding after revoked pairing.

---

## Phase 6: Polish & Cross-Cutting Acceptance

**Purpose**: Finish and measure only after all story checks and both voice gates pass.
No production hosting, accounts, persistence, cloud provisioning, or added AI scope.

- [X] T035 Write and run failing accessibility control/status checks in tests/browser/accessibility.spec.ts for keyboard activation, visible focus, readable notices, live status announcements, no hover-only controls, and “at least 44 × 44 CSS pixels” phone targets; record RED evidence before T036.
- [X] T036 Complete accessible control/status styling in src/components/DrawingToolbar.tsx, src/components/ConnectionControls.tsx, src/components/SharingStatus.tsx, and src/app/globals.css to make T035 green, retaining the documented exclusion of full nonvisual freehand authoring.
- [X] T037 [P] Create deterministic synthetic workload/visual-case descriptions in tests/fixtures/workloads.ts and tests/fixtures/visual-cases.ts from specs/001-discuss-diagram/validation.md: fixed 500×1,000-point workload and ten described cases; construct image buffers only in memory and keep correct visual answers out of MCP text/IDs.
- [X] T038 [P] Audit application/test logging, caches, failure artifacts, and token handling in src/broker/server.ts, playwright.config.ts, and specs/001-discuss-diagram/privacy-review.md; add failing regression tests for any actual uncovered leak in tests/contract/privacy.test.ts before fixing it, and record no persisted snapshots/capabilities or stale-image fallback.
- [X] T039 **WAIVED by operator 2026-11-05; measurements not performed.** Original task: Record actual Mac model/chip/RAM, macOS/Chromium/Safari builds, iPhone 12/iOS/Safari, viewport/power/display settings, and physical measurement apparatus in specs/001-discuss-diagram/validation-results.md; run the 30s warm-up and three 100-sample drawing/selection runs per target from validation.md, with conservative physical-input-to-visible uncertainty and p95≤100ms required per series; record unavailable measurement as blocked, never substitute rAF proxy.
- [X] T040 **WAIVED by operator 2026-11-05; preparation complete, participant/reviewer runs not performed.** Original task: Prepare frozen matched persona-task assignments and ten-case grading records in specs/001-discuss-diagram/pilot-results.md per validation.md; run the five-user first-use/pairwise pilot and ten-answer target-user review, record timing/assistance/incomplete attempts/disagreements, and retain metadata/rationale only, not snapshot files or tokens.
- [X] T041 Run pnpm install --frozen-lockfile, then unit/contract/browser suites, typecheck, lint, and production Next.js build through pnpm scripts in package.json; run the built app with the same broker and complete quickstart.md on macOS Chromium/Safari and iPhone 12. Record actual commands/results and material limits in specs/001-discuss-diagram/test-evidence.md; if anything fails, create a failing behavior regression before its fix and rerun affected checks.
- [X] T042 Reconcile actual launch scripts, pairing setup, limits, results, and unresolved acceptance blockers in README.md, specs/001-discuss-diagram/quickstart.md, and specs/001-discuss-diagram/plan.md; report SC-001–SC-007 individually and distinguish functional demo, measured acceptance, and blocked user/device evidence without auto-checking reviewer-owned checklists.

---

## Dependencies & Execution Order

### Phase dependencies and hard gates

```text
Setup T001–T003
  → experiment RED T004 → GREEN T005 → real voice Gate A T006
  → US1 minimal T007–T016 → selected-canvas voice Gate B T017
  → US1 completion T018–T022
  → US2 T023–T027 and US3 T028–T034
  → cross-cutting T035–T042
```

T006 and T017 require observed client evidence. Merely checking a task, implementing a stub,
passing controlled tests, or finding documentation is insufficient. Unavailable account,
physical device, operator setup, or microphone is a BLOCKED evidence requirement; unsupported
capability returns scope to the user. Do not mark either gate passed without real evidence.
No automatic text-chat, appshot, API Realtime, in-app voice, or different-device substitution.

### User-story dependencies and independence

US1 depends on the controlled-image foundation. US2 and US3 depend on the shared US1 canvas,
capture, and pairing slice; neither requires the other story's scenario to be exercised.
They are independently testable with supplied sketches/controlled MCP clients after that
shared foundation. US2 and US3 both edit broker/session files, so their implementation tasks
must be serialized unless a separate change first makes ownership disjoint.

### Within each phase

- T004 → T005 → T006; do not initialize the product before Gate A.
- T008 → T010, T009 → T011; both models precede endpoint integration.
- T012 → T014, T013 → T015; T010/T011/T014/T015 precede T016 and Gate B.
- T018 → T020, T019 → T021; both green before T022.
- T023 → T025, T024 → T026; T025/T026 precede T027.
- T028 → T031, T030 → T032, T029 → T033; integrated green before T034.
- T035 → T036. T037 fixtures precede T039/T040 measurements and pilot.
- T038 audit/regressions precede final T041; T039–T041 evidence precedes T042 closeout.

## Parallel Execution Examples

### US1

After T007, author/run T008 drawing-state tests and T009 session-access tests in parallel;
they use different files and both precede their implementations. After the base models,
T012 crop browser tests and T013 read contract tests can run together. After Gate B,
T018 history tests and T019 input-workflow tests are separate workstreams. All RED/green
boundaries remain sequential; the implementation tasks themselves are not marked parallel.

### US2

After US1, T023 provenance contract tests and T024 status browser tests may be authored/run
in parallel. Then perform T025 and T026 in dependency order and run the complete story.

### US3

After US1, T028 fake-clock unit tests, T029 browser recovery tests, and T030 session-recovery
contract tests may be authored/run in parallel. Serialize shared broker/client implementations.

### Cross-cutting

After story completion, T037 deterministic fixtures and T038 privacy audit operate on distinct
files and may proceed together. They do not permit running T039/T040 before fixture readiness.
Parallelism is an execution option, not a request to spawn implementation agents now.

## Implementation Strategy

### MVP first

Deliver no broad product before the controlled-image Gate A and minimal live selected-canvas
Gate B. The MVP is US1: local ink, explicit crop, protected fresh read, actual ChatGPT desktop
voice discussion, and manual revision on macOS Chromium/Safari and iPhone 12 Safari.
Retain privacy, revocation, deadline, and immutable-crop safety from the earliest live read;
these cannot be deferred to polish. Undo/redo and clear capacity recovery complete US1.

### Incremental delivery

After US1, US2 makes shared context/provenance clearer; US3 deepens outage/re-pair behavior.
Run each independent supplied-sketch scenario before moving on. Pilot/performance and physical
hardware acceptance are separate from functional completeness. Do not present 33/33 document
review as product verification. Product release readiness requires actual SC results.

## Notes and Requirement Coverage

| Coverage | Tasks |
| --- | --- |
| FR-001–FR-003 ink/history/selection | T008, T010, T012, T014, T016, T018–T022 |
| FR-004–FR-007 preview/capture/scope | T012–T016, T023–T027 |
| FR-008–FR-010 errors/fresh retry/no mutation | T013–T016, T022, T028–T034 |
| FR-011 honest last-sent status | T013, T023–T027 |
| FR-012–FR-013 visual uncertainty/external voice | T004–T006, T015–T017, T040 |
| FR-014–FR-016 access/session loss/retention | T009, T011, T016, T028–T034, T038 |
| SC-001 / SC-005 / SC-006 | T037, T040 |
| SC-002 / SC-003 | T012–T015, T023–T034, T038 |
| SC-004 | T037, T039 |
| SC-007 | T006 controlled stage, T017 full live-canvas gate |
| Accessible controls and keyboard/status | T035–T036 |

Preserve real red/green evidence without credentials or image bodies. No source file, test,
package, tool installation, deployment, or live connection is created by this document.

## Execution closeout — 2026-11-05

Functional implementation and on-demand verification are complete. T022/T034/T041 are
complete with native Safari/Chrome walkthroughs, actual MCP outage/restart/re-pair reads,
physical iPhone observations, and automated edge cases recorded in test-evidence.md.
40 unit/contract tests, 20 browser scenarios, typecheck, lint, frozen install and build pass;
the last UI change reran its four affected browser scenarios plus typecheck/lint/build.
T039 and the unrun participant/reviewer work in T040 were explicitly waived by the operator.
Checked waiver entries mean disposition is complete, not that measurements or pilots passed.
All implementation work and current acceptance obligations for this first spec are closed.
No new feature scope or automatic test hooks were added.

## Acceptance scope decision — 2026-11-05

The operator explicitly waived participant testing and then physical latency measurements
for this first spec. SC-001, SC-004, SC-005 and the formal target-user grading portion of
SC-006 are waived for this iteration, not passed. No five-user results, measured p95, or
ten-answer grade is claimed. The completed functional checks and observed live voice
results remain valid. These waivers close the remaining acceptance gates for this spec;
future releases may reinstate the retained protocols.

## Phase 7: Convergence

Assessed 16 functional requirements, 12 story acceptance scenarios, three active buildable
success criteria (SC-002/SC-003/SC-007), ten plan decisions, all 42 existing task dispositions,
and five constitution principles plus scope constraints. Explicit operator waivers govern
participant grading and physical latency; these unrun outcomes are not implementation gaps.
Findings: one missing/HIGH, one partial/HIGH, one partial/LOW; zero contradicts/unrequested.

- [X] T043 Add a user-accessible Clear selection action and state transition per FR-003 (missing, HIGH). Current DrawingToolbar/state support replacement but no clear operation; preserve ink/history, increment selection revision only when clearing an existing selection, and make the next read return NO_SELECTION. Begin with failing unit/browser regressions and verify keyboard/touch access.
- [X] T044 Enforce the 6 MiB browser-proxy request limit while streaming per T032 / plan: route validation and bounded payloads (partial, HIGH). The Next route currently calls request.arrayBuffer() before checking length. Reject oversized declared or streamed bodies before accumulating excess bytes, cancel the reader, retain no-store errors, and verify with a failing bounded-stream regression before implementation.
- [X] T045 Reconcile stale completion/feasibility/authentication descriptions per T042 / plan: local helper pairing (partial, LOW). Spec header still says feasibility pending; plan body says gates NOT RUN and environment-provided bearer configuration; tasks header describes only T001–T017. Update current status while retaining actual historical evidence and explicit waivers, then rerun convergence.
