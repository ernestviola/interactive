# Interactive Constitution

## Core Principles

### I. Deliver the Smallest Useful Workflow

Every feature MUST address an explicit task for product designers or system architects.
Each delivery MUST provide a usable end-to-end slice with observable acceptance criteria.
New capabilities MUST be justified by a demonstrated gap in that workflow; speculative
infrastructure and abstractions for uncommitted future features MUST be deferred.

The current product workflow MUST let a user open a drawing canvas, sketch an idea,
navigate the drawing, and ask ChatGPT to inspect the current drawing without exporting an
image. The canvas MUST remain useful for drawing even when ChatGPT is unavailable.

### II. Ground Conversation in the Canvas

Each successful AI read MUST capture one consistent canvas revision as an immutable
image with a snapshot identity and capture time. The image MUST follow the current
feature's declared sharing scope. For the canvas-first workflow, that scope is all
committed strokes in the active drawing, framed by their bounds; a separate user-drawn
selection is not required. The app MUST NOT silently substitute a stale, unrelated,
or partial image when an authorized current capture is unavailable.

Navigation MUST NOT change drawing content or the content eligible for capture. Later
edits MUST NOT alter an earlier snapshot. Freehand marks MUST NOT be treated as verified
semantic objects or relationships. AI reads MUST occur on request during the external
conversation; the app MUST NOT continuously stream images merely because drawing pauses.

### III. Keep Users in Control

Users MUST draw and edit in a separate web app; ChatGPT provides the conversation.
AI access MUST be read-only with respect to the canvas. Reads, failures, and retries
MUST preserve strokes, drawing history, and navigation state. The drawing surface
MUST remain usable during connection outages.

An AI-focused canvas MAY establish its session-scoped read connection automatically
when opened, without a manual Connect action. The connection MUST identify one active
canvas session, MUST NOT expose unrelated sessions, and MUST expire or be revoked when
that session ends. The app MUST make the sharing scope discoverable without requiring
persistent canvas UI. Any future AI canvas modification MUST be reviewable before
application and reversible afterward; suggestions MUST never silently overwrite work.

### IV. Make AI Claims Understandable

AI responses MUST distinguish proposals and inferred behavior from verified
implementation facts. A drawing alone MUST NOT be presented as evidence of what has
been built. Claims about implementation MUST cite accessible supporting evidence
when that capability is introduced; missing evidence MUST be stated explicitly.

The integration MUST instruct the AI to acknowledge uncertain handwriting or visual
interpretations. Only drawing content authorized by the active session's declared
sharing scope MAY be exposed to the connected AI client. Service credentials MUST
NOT be embedded in client code or recorded in application logs. The app MUST explain
that images already delivered to ChatGPT cannot be revoked by editing or closing the
canvas and follow ChatGPT's retention settings.

### V. Validate User Outcomes with TDD

Acceptance criteria MUST cover starting a drawing, freehand input, navigating the
open canvas, asking ChatGPT to inspect the current drawing, interpreting the answer,
and continuing to edit. Validation MUST include capture accuracy, gesture transitions,
history, connection failure, and session isolation. Routine verification MUST use
controlled responses rather than require a live provider. Product evaluation MUST
assess whether the workflow helps users find a gap or make a decision compared with
manual screenshot sharing.

Context capture, immutable snapshots, drawing state transitions, failure recovery,
and protection against unintended canvas mutations MUST follow test-driven development.
For new or changed behavior in these areas, write a behavioral test first, run it and
confirm it fails for the intended reason, implement the smallest change that makes it
pass, then refactor while keeping tests green. Bug fixes in these areas MUST begin
with a failing regression test. Tests MUST assert observable behavior rather than
mirror implementation details. Validation MUST cover desktop mouse or trackpad input
and touch input on the supported mobile devices.

Visual layout, styling, and exploratory interaction prototypes MAY use manual
validation without test-first development. Any prototype promoted into the product
MUST meet the TDD requirements above for covered behavior before completion.

## Product Scope and Constraints

The product is a separate, single-user web canvas for open-ended freehand drawing.
Desktop mouse and trackpad input and iPhone finger input are required; touch panning
and pinching MUST coexist with one-finger drawing. ChatGPT is the intended conversation
and voice interface. The web app MUST NOT require its own chat panel, microphone capture,
or speech playback.

For the current canvas-first workflow, the configured AI client reads the active
drawing on demand. Normal use MUST NOT require a manual region selection or Connect
button. The app MUST keep canvas data transient for the open session and MUST protect
the read connection so it cannot access another session. No idle-triggered image stream
is required. Automatic image segmentation, structured diagram objects, handwriting
recognition, and AI canvas edits require separate demonstrated user needs.

The application MUST use Next.js. The current local canvas and loopback broker MAY
operate without a GCP service. A future feature that specifies cloud deployment MUST
use Google Cloud Platform (GCP) unless this constitution is explicitly amended again.
No GCP service or deployment is required for a feature whose approved scope is local
only. When cloud deployment is specified, the implementation plan MUST justify each
GCP service and connection mechanism and limit them to what that feature needs.
Access protection and data lifecycle rules MUST be explicit in the feature
specification before release.

Spoken discussion MUST NOT be assumed feasible merely because text-based tools work.
Before implementing a new spoken workflow, a capability check MUST demonstrate a
ChatGPT voice conversation reading a current canvas image and giving a relevant
spoken answer. The check MUST document the device arrangement. If unsupported, scope
MUST return to the user for a decision; text chat or an in-app voice interface MUST
NOT be silently substituted.

## Development Workflow and Quality Gates

Before implementation, the feature specification MUST define the target user task,
scope, non-goals, and observable acceptance criteria. The implementation plan MUST
record a constitution compliance check and explain any additional complexity.

Tasks MUST prioritize a complete draw–navigate–discuss workflow before optional
polish or extensions. Plans and tasks MUST sequence failing tests before implementation
for behavior covered by Principle V. Change summaries MUST record the observed failure
and subsequent passing result. Review MUST verify that the image sent to AI matches
the active drawing at capture time, that failures preserve work, and that unrelated
canvas sessions are not exposed.

Before a change is considered complete, the relevant automated checks and a manual
walkthrough of the affected user workflow MUST pass. Validation results and known
limitations MUST be recorded in the change summary. Documentation-only changes
require consistency checks, not application tests.

## Governance

This constitution governs project specifications, plans, tasks, and implementation
decisions. Conflicts MUST be resolved by changing the proposal or explicitly amending
this document. Every feature specification, implementation plan, and change review
MUST check compliance.

Amendments MUST state the reason, affected principles, version change, and consequences
for existing specifications or implementation. Amendments require project maintainer
review before adoption; accepted changes MUST be propagated to affected project
artifacts.

Version 3.0.0 replaces selected-region sharing and manual pairing in Principles I–IV
and updates the validation obligations in Principle V for the canvas-first workflow.
The earlier feature specification remains a record of its delivered behavior; new
work follows the whole-drawing, on-demand rules established in that version.

Version 4.0.0 replaces the immediate GCP-use obligation in Product Scope and
Constraints with permission for local-only features and a GCP requirement for future
specified cloud deployment. The current canvas-first plan remains local; no cloud
deployment is added by this amendment.

Versions follow semantic versioning: MAJOR for incompatible principle removals or
redefinitions, MINOR for new principles or materially expanded guidance, and PATCH
for clarifications that do not change obligations. Every amendment MUST update the
last-amended date; the original ratification date MUST remain unchanged.

**Version**: 4.0.0 | **Ratified**: 2026-11-05 | **Last Amended**: 2026-11-05
