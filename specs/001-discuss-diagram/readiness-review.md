# Readiness Checklist Review

**Date**: 2026-11-05
**Authority**: User explicitly requested evaluation of the existing checklist.
**Scope**: Standard-depth review of written requirements before task generation.
**Original result**: 28/33 satisfied. **After planning refinement**: 33/33 written criteria
satisfied; see Resolution below. No implementation or runtime validation was performed.

## Original requirements-quality findings (resolved below)

### CHK007 — “AI inspected” overstates the available signal

Spec FR-011 says users can tell when the connected AI “last inspected the sketch.”
The data model and local-session contract correctly say the status means sent to the MCP
client, not confirmed receipt, comprehension, or a spoken answer. The quickstart still uses
“Latest-delivered.” These terms describe different evidence.

Proposed correction: make FR-011, User Story 2, plan traceability, and quickstart consistently
say “last sent to the AI client,” displaying snapshot capture time and identity after a
successful send. Keep model interpretation and spoken response as separate SC-007 evidence.
Do not imply transport success proves visual inspection.

### CHK016 — Pilot comparisons and response grading lack a reproducible rubric

SC-005 requires “comparable, counterbalanced tasks” but does not define the task pairs,
matching criteria, time boundaries, or treatment of incomplete attempts. SC-006 lists useful
quality dimensions but leaves the ten-question set, expected visual facts, and scoring rule
unspecified. A numeric threshold alone does not make different reviewers consistent.

Proposed correction: define matched tasks by drawing complexity and required decision;
specify timing start/stop and failed-task handling. Define a reusable set of ten sketches and
questions with expected visible facts and known ambiguities. An answer passes only when it
addresses the selected content, does not contradict visible relationships, acknowledges
relevant ambiguity, and makes no unsupported implementation claim. State who grades and
how disputed judgments are resolved before the pilot.

### CHK017 — Performance acceptance lacks an agreed measurement baseline

SC-004 specifies p95 within 100 ms and a 500-stroke workload, but “supported test device”
does not identify a baseline model/OS/browser, number of samples, or measurement conditions.
The quickstart repeats the target without specifying whether the measured endpoint is a
scheduled repaint or actual visible feedback. Those measures can yield different results.

Proposed correction: document desktop and iPhone baseline hardware/OS/browser before
measurement, a fixed workload and sample count, warm-up/background conditions, and one
pointer-input-to-visible-presentation measurement method. Distinguish any instrumented
proxy from actual presentation latency. Keep the existing threshold unless the user changes it.

### CHK025 — Capacity boundaries and recovery are only partially specified

The data model allows rejecting additional strokes with a “clear limit message” but does not
choose whether 500 strokes/1,000 points is a performance envelope or a hard content limit.
Image dimensions/payload limits are defined. The session contract bounds session creation,
but a user-facing recovery action for exhausted session capacity is not defined.

Proposed correction: distinguish performance targets from content limits, document the
chosen overload policy without silent ink loss, and specify how the user resumes drawing.
For session exhaustion, define an actionable message and recovery such as ending another
session or waiting for lease expiry. Preserve existing work on every rejected operation.

### CHK032 — Older checklist notes contradict the accepted scope

The built-in requirements.md still describes “independent questions,” “one pending attempt,”
a “60-second response deadline,” and an earlier interpretation of FR-015–FR-016. Those notes
predate the external-conversation freehand workflow; the current capture deadline is 10s.
Its title still names the previous selected-diagram feature, and the blanket “all 16 checks
pass” note is not evidence that these newer cross-artifact issues were reviewed.

Proposed correction: reconcile this artifact through its specify/clarify lifecycle; remove
obsolete chat assumptions, use the current feature title and requirement mapping, and
re-evaluate its claims. This review intentionally does not edit that separate checklist.

Checklist wording caveat: CHK032 asks whether stale notes were identified for reconciliation;
they have now been identified. It remains unchecked conservatively because reconciliation
has not occurred. Future wording should ask whether the inconsistency is resolved.

## Evidence supporting satisfied items

| Items | Evidence and reason |
| --- | --- |
| CHK001–CHK004 | Spec User Story 1, FR-001–FR-005 and FR-014–FR-016, and Assumptions define the core journey, device arrangement, no-login pairing, and retention notice. |
| CHK005–CHK006 | Spec FR-003–FR-008 plus data-model Selection region/Capture request define clipping, emptiness, frozen revisions, and gesture handling. |
| CHK008 | MCP Errors and local-session Presence and cancellation distinguish errors, 10s timeout, cancellation, and fresh retries. |
| CHK009 | Plan Status/Constitution Check and feasibility Evidence record/Decision rules distinguish design completion from runtime NOT RUN. |
| CHK010 | Spec Assumptions and planning-inputs Later scope decisions explicitly defer GCP under the user's later local-only instruction; the future platform requirement is retained. |
| CHK011 | Spec FR-016 and data-model Sketch session distinguish explicit end from the documented best-effort close notification and 20s presence bound. |
| CHK012 | Spec FR-012–FR-013, Assumptions, and Plan Summary consistently exclude AI edits, embedded conversation, recognition, and structured diagrams. |
| CHK013–CHK014 | Feasibility Procedure/Decision rules require voice, image interpretation, a fresh second read, and separate controlled-image versus selected-canvas evidence. |
| CHK015 | SC-001 defines four of five participants, both personas, at least two per device type, five minutes, and exclusion of connection setup. |
| CHK018–CHK021 | Spec journeys/Edge Cases and local-session presence rules cover alternate devices, empty/error flows, retained local ink on reconnection, and unsupported capability outcomes. |
| CHK022–CHK024 | Data-model Capture request and both contracts cover unfinished gestures, revision freezing, concurrent/late/cancelled reads, pairing rotation, and already transmitted bytes. |
| CHK026–CHK029 | Spec privacy requirements and contracts define session isolation, distinct capabilities, transient data, accessible controls/status, 10s reads, and 20s leases. |
| CHK030–CHK031 | Research sources, feasibility prerequisites, and quickstart distinguish desktop-local connectivity/account rollout from actual runtime acceptance and private-LAN phone access. |
| CHK033 | Constitution V, Plan Execution Boundaries, and quickstart require observed failing tests before covered implementation while retaining SC-007 as NOT RUN. |

## Checklist quality itself

All 33 items have unique IDs and traceable source references. They ask about requirements
quality rather than implementation success. No duplicate items warrant removal. CHK032's
identification-versus-resolution wording is weaker than the intended readiness criterion,
as noted above. No checklist questions were appended or deleted during this evaluation.

## Review boundary

Only readiness.md markers/evaluation notes and this report changed. Spec, constitution,
contracts, and application source were not changed. No tests, voice session, MCP connection,
or dependency installation were run. Runtime feasibility remains unproven even where its
written acceptance requirements passed this review. Resolve these document findings before
treating this checklist as fully satisfied for product task readiness.

## Resolution — planning refinement 2026-11-05

The user's macOS/Chromium/Safari and iPhone 12 targets are incorporated into the spec and
plan. The previous request to evaluate the checklist remains the authority for re-evaluating
its five open items; no new checklist items are generated or silently auto-approved.

| Item | Document correction and re-evaluation evidence |
| --- | --- |
| CHK007 | FR-011 and User Story 2 now say “Last sent to AI client”; quickstart/plan use last-sent wording. This is distinct from spoken understanding evidence. |
| CHK016 | validation.md defines matched designer/architect tasks, counterbalancing, timer boundaries, incomplete runs, ten visual fixture descriptions, binary rubric, reviewers, and unresolved disagreement handling. |
| CHK017 | validation.md fixes macOS Chromium/Safari and real iPhone 12 Safari, baseline recording, workload, warm-up, three 100-sample runs per interaction type, physical presentation measurement and uncertainty. Unknown Mac details are recorded before tests, not invented. |
| CHK025 | Spec/data model set explicit stroke/point caps separate from performance workload. Rejected strokes preserve work; discard-redo/new-session recovery and session/rate-limit recovery are documented. |
| CHK032 | requirements.md title and notes now reflect freehand external conversation, current FR mapping, 10s capture deadline, and unexecuted runtime gate. Obsolete chat assumptions are removed. |

Re-evaluation: all five now satisfy their written requirements criteria; checklist markers
are updated under the user's explicit review request. Historical findings above are retained
for traceability. The original Review boundary describes the earlier review, not these later
planning amendments. All changes remain documentation-only; SC-007 and performance/pilot
outcomes are still unexecuted and are not inferred from checklist completion.
