# Implementation test evidence

Only test names, counts, timings, and observed behavior belong here. No capabilities,
image bodies, complete tool results, or runtime fixture answers are recorded.

## Controlled-image experiment (T001–T006)

Implementation started on 2026-11-05. Automated contract results and the separate actual
desktop voice gate are recorded independently. Neither a passing test client nor Inspector
proves that the voice client consumes images.

### T004 RED

`pnpm run test:contract` on Node 24.22.1 / pnpm 12.15.0 against the SDK transport
scaffold: **8/8 behavioral tests failed** (2.25s). Observed invalid/empty PNG bytes,
missing snapshot identity/time, unchanged image after fixture replacement, permissive
input schema, missing capability and origin enforcement, unbounded hung capture, and
unsanitized renderer failure. The first sandbox attempt could not bind loopback (EPERM);
the recorded behavioral run used authorized local networking and successful SDK initialization.
No image buffers or capabilities were emitted in failure output.

### T005 GREEN and independent verification

- `pnpm run test:contract`: **8/8 pass**, 360ms total. Covers PNG decoding/ink,
  fresh IDs/timestamps, image replacement/immutability, strict input/tool scope,
  bearer rejection, Host/Origin rejection, bounded timeout, and safe failure/retry.
- `pnpm run typecheck`: PASS with TypeScript 7.0.2 and strict NodeNext settings.
- `pnpm install --frozen-lockfile`: PASS on Node 24.22.1 / pnpm 12.15.0.
- `pnpm run experiment:verify`: PASS using **Inspector CLI 2.14.0**. Two actual
  HTTP tool calls returned different PNGs and fresh text metadata after a controlled
  source replacement. Inspector response bodies were consumed in memory and discarded;
  only the verification summary was printed. The wrapper handles Inspector's JSON
  `result` envelope. This does not establish actual ChatGPT text or voice behavior.
- `git diff --check`: PASS.

Refinement: test results are parsed through the SDK CallToolResult schema; unknown tools
use the SDK's standard error result. The forged-Host test uses raw Node HTTP because fetch
rewrites Host. PNG ink assertions exclude scanline filter bytes. These changes preserve
behavioral coverage without printing image or authorization values. Image handling contains no file/storage writes, image cache, or response-body logging.
The later no-export setup uses a separate private operator credential file, as described below.

The initial install required explicit approval of esbuild's build script. Only esbuild
is allowlisted in pnpm-workspace.yaml. The project-local pnpm store is ignored by Git.
An initial network-restricted run could not fetch packages and was not counted as RED
or GREEN. The final frozen install succeeded with authorized registry access.

### T006 gate and execution state

**BLOCKED** pending an actual desktop task connection, text baseline, live voice with two
fresh reads, and disconnection observation. No voice, physical iPhone, performance, or
pilot pass is claimed. Temporary verification servers were stopped. No persistent server
or desktop MCP configuration was installed. T007–T042 remain unstarted under the plan's
explicit gates. Operator startup and connection instructions are in feasibility.md.

## No-export startup refinement

User requested package-manager startup without repeated variable exports. Two local-config
regressions were written and observed failing (2/2 RED), then passed after implementation
(2/2 GREEN). They verify stable reuse, random 256-bit format, owner-only permissions, and
safe rejection of malformed content without overwriting or exposing it. Temporary test
configuration directories are removed after each test. No credentials are test artifacts.

`pnpm install` resolved and locked the exact Node 24.22.1 runtime through `devEngines.runtime`.
`pnpm run test:unit` (2/2), `pnpm run test:contract` (8/8), and `pnpm run typecheck` passed
without PATH or token exports. First interactive startup creates the separate Git-ignored
`.env.voice.local` operator credential; images and fixture answers remain memory-only.
The local MCP authentication helper reads that credential without requiring GUI environment
inheritance. No global host configuration was changed and no persistent server was started
as part of this refinement. Actual desktop MCP and live voice observations remain pending.

## Operator connection setup

The operator subsequently started the experiment and added a desktop MCP entry named
`interactive`. Read-only inspection confirmed the expected enabled local HTTP endpoint but
no authentication. Added only its missing `http_headers_helper` in the existing host
configuration. No bearer value was copied into the config or printed. A controlled SDK
client using that exact helper successfully initialized the **running** server and listed
`read_selected_sketch`; it did not read the operator's image. Reload/reconnect of the
desktop entry and actual conversational image/voice evidence remain pending. This is a
connection check, not a text baseline or Gate A pass.

## Actual desktop conversation — partial T006

The `interactive` integration became available after the host configuration reload. An
actual live-voice-triggered `read_selected_sketch` call returned snapshot
`33de646b-e545-4c3d-89bc-d356686d4365`, captured 2026-11-05 23:50:48.235 UTC. The spoken
interpretation identified the visual symbol and all four digits. The operator explicitly
confirmed they matched their private terminal input. Only identity/time and correctness
assessment are recorded here; no fixture answer or image is stored.

Resuming implementation in ordinary text chat produced a fresh integration call and snapshot
`0ea86568-fc7e-4bc1-8fe6-a79e828e2d22`, captured 2026-11-05 23:54:09.580 UTC. Its PNG
showed the same current fixture and was correctly interpreted from the pixels. This completes
the text baseline, although it happened after the first voice read. It does not substitute
for the required changed second image in one voice conversation. Numeric server request IDs
were not captured; snapshot IDs and returned capture times are the available correlations.

T006 remains **PARTIAL / BLOCKED** pending changed-image live voice and actual disconnection
observations. T007 onward remains unstarted. The runtime gate is a task dependency, not a
request to repeat package setup or to re-add the working MCP connection. No new automated
test run was needed for these evidence-only updates. `git diff --check` validates formatting.

### Same-session changed-image voice result

The resumed live voice session produced fresh snapshot
`76bde775-2568-4968-a0dc-7094208c46ff` at 2026-11-05 23:56:04.884 UTC, followed by
`b6f6ffa2-7e9c-41fa-9ccf-1bd928048e23` at 23:56:39.756 UTC after the operator changed
the fixture. The second call followed their spoken recheck request in the same voice
session. The spoken answer described the new image correctly and the operator confirmed
the match. Two-image voice freshness is now PASS. Actual server-disconnection behavior
is still pending, so T006 remains unchecked and T007 has not started.

### Gate A / T006 PASS

At 2026-11-05 23:57:41 UTC, after the operator reported the server had exited, an actual
integration read in the continuing voice session returned an HTTP transport failure with
`isError=true` and no image. No old image was returned or described as a fresh result.
Combined with Inspector, text baseline, and operator-confirmed changed-image voice reads,
this completes T006 and permits T007–T016. Gate B / T017 and physical-device acceptance
remain unexecuted. Earlier partial-status entries are historical and superseded here.

## Minimal selected-canvas slice — T007–T016

T007 pins Next.js 16.4.5, React/React DOM 19.3.1, Playwright 1.64.1, and exact React
types 19.3.0. The Next.js shell served successfully through the supervised dev launcher.
Node/pnpm remain managed by the package manager, with no shell exports. Chromium and
WebKit test runtimes were installed; emulated WebKit does not constitute physical iPhone
acceptance. Framework source references: https://nextjs.org/docs/app/getting-started/installation
and https://nextjs.org/docs/app/api-reference/file-conventions/route.

- T008 RED: 3/3 drawing-model tests failed on missing committed strokes and selection.
- T009 RED: 4/4 session-access tests failed on empty capabilities, missing lifecycle,
  and permissive Host/Origin checks.
- T010/T011 GREEN: all 7 model/session tests passed after implementation. State updates
  are immutable; the registry stores capability hashes and revokes expired/ended sessions.
- T013 RED: 9/9 capture-relay tests failed on absent requests, missing BUSY handling,
  and missing timeout/revocation behavior.
- T015 relay GREEN: all 9 capture-relay tests pass. PNG signature, checksums, dimensions,
  bounded decompression, and matching request/generation/epoch are validated.
- T012 RED: all 3 Chromium scenarios failed against the successfully running shell
  because the drawing workflow was absent. These were UI behavior failures, not server
  startup failures. An earlier missing package script was corrected before the recorded
  RED run and was not counted as behavioral evidence.
- Typecheck passes after the minimal renderer, relay, proxy, and pointer UI are wired.

Browser green results and integration observations follow after verification. No browser
traces, screenshots, videos, image output files, or credential-bearing artifacts are enabled.

### T007–T016 GREEN / Gate B ready

- `pnpm test`: **29/29** unit/contract checks pass, including actual product MCP schema,
  tool scope, typed errors, session isolation, and the native-client handoff.
- `pnpm run test:browser`: **6/6** pass (three scenarios each in Chromium and WebKit).
  The exact crop's decoded pixels equal the preview, crossing strokes clip correctly,
  blank/absent selections have no image fallback, and detached rendering freezes revisions
  while editing continues. The live native helper resolves the browser-issued capability.
- `pnpm run typecheck`, `pnpm install --frozen-lockfile`, `pnpm run build`: PASS.
  The production build exposes the UI and dynamic same-origin session proxy.
- A startup regression was observed before its fix: Start drawing did not hydrate because
  Next.js rejected its development HMR connection from the loopback test host. The
  existing browser tests reproduced it. Explicit allowedDevOrigins fixed it; all six then
  passed. No capability/image payload was present in the diagnostic output.
- Native-client handoff refinement: two new behavioral tests first failed (2/2 RED),
  then passed (2/2 GREEN). The slot requires the operator bootstrap, transfers only an
  explicitly owner-paired read capability, revokes the earlier capability on explicit
  session switching, and clears on expiry/end. It stores no image or durable read key.

The built app and loopback broker were started for the operator's next gate. The exact
current Wi-Fi origin is configured in ignored `.env.local`; no secret is included in that
LAN configuration. The browser-panel open request was queued for this chat, so no claim
is made that the user has seen it yet. Real desktop voice/canvas and physical iPhone 12
observations are still required by T017; WebKit emulation does not complete that gate.
No T018+ task has started, and no full-feature/performance/pilot acceptance is claimed.

## Final functional checks and physical walkthrough in progress

- Current automatic suite: **39 unit/contract tests and 16 Chromium/WebKit browser tests PASS**.
- `pnpm run lint`, `pnpm run typecheck`, `pnpm run build`, frozen install, and peer checks PASS.
- Real touch regression: WebKit finger tap committed a stroke but drew no dot for duplicate
  stationary points. The new native-touch pixel-change test first failed, then passed after
  rendering a dot for entirely stationary strokes. Pointer cancellation, orientation,
  history, complete overlong-stroke rejection, offline drawing, and fresh re-pair pass.
- Native-helper test fixture initially blocked its own local broker using a synchronous
  subprocess; switched the test to asynchronous subprocess I/O. This was harness deadlock,
  not a server credential failure. Both browser engines now verify the actual helper key.
- Required lint exposed TypeScript 7 parser incompatibility. Compatible final pins are
  TypeScript 6.0.3 and ESLint 9.39.5 with eslint-config-next 16.4.5. ESLint 10 was checked
  but excluded by the bundled React/import/accessibility plugin peer ranges. All peer
  requirements and strict lint pass on the final pins. See research.md for rationale.
- Operator began the physical iPhone walkthrough on the updated build and explicitly
  confirmed separate strokes, Undo, and Redo behaved as expected. Selected read/status,
  background/resume, end/revocation, and manual Mac browser checks are still in progress.

No final physical-performance or five-user pilot result has been claimed.

## On-demand runner and final autonomous verification

User explicitly requested repeatable command-driven checks instead of repeated manual
walkthroughs, with **no automatic run on every commit**. Added `pnpm run verify` and kept
focused unit/contract/browser commands. No Git hook or scheduled automation was added.
Browser verification uses isolated ports 3100/3101 and a separate Next dev output directory,
so it can run alongside the ordinary canvas. Broker instances are test-owned and restarted
by the fixture; fake clock advancement is injected at construction, never exposed as an
application endpoint.

`pnpm run verify` PASS: frozen install, **39 unit/contract checks**, **20 browser checks**
(Chromium and WebKit), strict typecheck, zero-warning lint, and production build. Additional
browser cases automate a 30-second logical lease expiry, background-style foreground
transition, re-pair after expiry, actual broker process-state restart, retained ink, invalid
old capabilities, and explicit session end. The simulated clock is not a physical latency
measurement or proof of iOS scheduling behavior.

Artifact audit: zero saved PNG/JPEG/video/trace archives in generated browser results;
zero operator bootstrap occurrences or bearer/credential-line patterns in text artifacts.
The private bootstrap configuration remains the explicit authorized local setup exception;
per-session read keys and drawings are never persisted. See privacy-review.md.

Physical-phone observations on the built app: the operator confirmed Undo/Redo, selected
preview matching the received crop, and the Last sent to AI client label. Actual integration
reads returned snapshot `4143d72d-b9fa-4ce6-a67c-15ca6f19d84e` at 2026-11-06 00:42:17.890 UTC
and, after a fresh tab/pairing, `31bdf835-1e9d-4e14-9eb6-0803fe4342f0` at 00:44:41.402 UTC.
A read while not actively paired returned an authorization error with no image, rather than
reusing earlier content. The operator then confirmed ink remained after Safari was
backgrounded for the requested interval and brought forward. A prior close-and-reopen
step intentionally lost ink and is recorded as fresh-session behavior, not outage preservation.
No actual drawing, credential, or image body is copied into evidence files.

Native installed Safari/Chrome manual acceptance, exact iPhone OS/browser builds, external
physical-input-to-visible measurements, and the specified five-user/ten-answer review still
have no complete results. Do not auto-check those tasks or claim release acceptance.

## Final regression and native Safari check

A concrete cleanup race was reproduced with a failing regression: discarding an old delivery
could cancel a newer pending capture. Capture cleanup now checks the original pending-request
identity. Affected 11 checks pass; the complete unit/contract run passes **40/40**. Typecheck,
lint and production build pass after the fix. The prior complete verify run passed all
20 browser scenarios. A sandbox-only repeat could not bind loopback (EPERM); rerunning
with local-server permission passed, without an application change.

Installed native Safari on the built app was exercised autonomously through UI controls:
two synthetic strokes, Undo (one stroke), Redo (two strokes), selected crop and Connect.
The actual configured MCP returned the expected synthetic crossing lines, snapshot
7bc99a03-6c13-443b-a099-cfc8397f700f at 2026-11-06 00:58:19.729 UTC, drawing revision 4 /
selection revision 1. Safari displayed Last sent to AI client with the same identity and
matching-revision status afterward. No image file was saved. This supplements, without
completing, the entire native-browser acceptance matrix.

## Native desktop closeout and outage-status regression

Installed Chrome was exercised through its actual UI on the production app: three
synthetic strokes, Undo/Redo, select, Connect, actual MCP read and matching Last sent status.
Snapshot a99a78d7-fe6e-4fb5-916d-07d149ed634a at 2026-11-06 01:01:49.896 UTC
had drawing revision 5 / selection revision 1. Editing retained its identity/time and showed
Changes since last send. An earlier read with no completed selection returned NO_SELECTION
without an image or canvas mutation.

The built service was then stopped deliberately; actual MCP failed without an image.
Chrome retained all four strokes and accepted a fifth offline. After restarting and one
explicit Connect, the actual MCP returned a fresh crop including those marks:
5f06ec6b-aabe-468b-a30d-e78a2cda36d8 at 01:02:31.525 UTC, revision 7/1.
The surviving native Safari tab retained its two strokes, accepted a third, and re-paired
explicitly. Actual MCP returned 470ff507-ae9c-45f3-bf8a-596f837f5782 at
01:03:04.675 UTC, revision 5/1, containing its original and new synthetic marks.
No image files or tokens were saved. Together with the recorded physical-phone walkthrough
and automated edge scenarios, this completes the functional T022/T034/T041 walkthroughs;
exact phone build and formal measurement/pilot prerequisites remain outstanding.

This native check exposed stale pairing guidance during an unavailable connection.
The focused outage test failed in both Chromium and WebKit because the helper-can-read
notice remained visible. ConnectionControls now renders that notice and advanced capability
only while paired/reading. The affected outage and sharing scenarios pass **4/4**, and
typecheck, lint, production build pass afterward. No unrelated feature was added.

## Acceptance scope decision — 2026-11-05

The operator explicitly waived participant testing and then physical latency measurements
for this first spec. SC-001, SC-004, SC-005 and the formal target-user grading portion of
SC-006 are waived for this iteration, not passed. No five-user results, measured p95, or
ten-answer grade is claimed. The completed functional checks and observed live voice
results remain valid. These waivers close the remaining acceptance gates for this spec;
future releases may reinstate the retained protocols.

## Convergence remediation — T043–T045

The requested Spec Kit Converge pass found FR-003's missing clear-selection operation,
T032's proxy limit checked only after full buffering, and T042's stale status/auth text.
T043 RED: the new state test failed because clearSelection was absent; both browser projects
failed because no Clear selection control existed. GREEN: clear only the region, preserve
ink/history, advance selection revision once, return NO_SELECTION until reselected. Keyboard
and phone-emulated touch access, 44px targets, redo preservation and fresh revision are checked.
T044 RED: the proxy consumed a third chunk after exceeding 6 MiB and ignored oversized
Content-Length. GREEN: bounded streaming stops/cancels immediately at excess, rejects an
oversized declaration without reading, and still forwards an exactly-at-limit body.
T045 reconciles current spec/plan/tasks statuses and helper-based pairing documentation.

The full on-demand `pnpm run verify` PASS after these changes: frozen install, **44 unit/contract
tests**, **22 Chromium/WebKit browser scenarios**, strict typecheck, zero-warning lint and
production build. Native Chrome on this built app additionally drew a synthetic stroke,
selected and paired it, then used Clear selection. Preview disappeared, the one stroke and
Undo remained, and the actual configured MCP returned NO_SELECTION with no image.
No new physical-device performance or participant evidence is claimed; the operator waivers
remain in effect.
