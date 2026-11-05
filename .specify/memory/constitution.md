<!--
Sync Impact Report
Version change: 1.1.0 → 2.0.0
Reason: Replace structured diagram and adjacent chat obligations with freehand sketching
and external ChatGPT conversation through MCP; preserve test-first governance.
Modified principles:
- II. Ground Conversation in the Canvas (visual selection and immutable snapshots)
- III. Keep Users in Control (external conversation and read-only AI access)
- IV. Make AI Claims Understandable (visual uncertainty and scoped access)
- V. Validate User Outcomes with TDD (capture and connection validation)
Modified sections: Product Scope and Constraints; Development Workflow and Quality Gates
Added sections: None
Removed sections: None
Follow-up: Reconcile feature spec's v1.1.0 reference and obsolete constitution-conflict note
in the next specification workflow; retain unresolved voice feasibility and access decisions.
Dependent templates and commands: Unmodified; read this constitution at runtime.
Deferred placeholders: None
Review note: Remove this temporary report before committing the constitution.
-->
# Interactive Constitution

## Core Principles

### I. Deliver the Smallest Useful Workflow

Every feature MUST address an explicit task for product designers or system architects.
Each delivery MUST provide a usable end-to-end slice with observable acceptance criteria.
New capabilities MUST be justified by a demonstrated gap in that workflow; speculative
infrastructure and abstractions for uncommitted future features MUST be deferred.
The first slice MUST let a user sketch a flow, select part of it, and discuss that selection
with AI to identify a gap or make a design decision.

### II. Ground Conversation in the Canvas

The application MUST make the user-selected visual region and the content eligible for
sharing visible before the connected AI reads it. Each successful read MUST capture one
consistent canvas revision as an immutable image with a snapshot identity and capture time.
Only content inside the selection MAY be shared; absence of a selection MUST produce clear
guidance rather than silently exposing the full canvas. Later drawing or selection changes
MUST NOT alter an earlier snapshot. Freehand marks MUST NOT be treated as verified semantic
objects or relationships. This keeps discussion grounded in what the AI actually inspected.

### III. Keep Users in Control

In the first slice, users MUST draw and edit in a separate web app; ChatGPT provides the
conversation, with spoken interaction subject to a verified capability check. MCP access
MUST be read-only with respect to the canvas. AI reads, failures, and retries MUST preserve
strokes and selection, and drawing MUST remain usable during connection outages.
Any future AI canvas modification MUST be reviewable before application and reversible
after application. Suggestions MUST never silently overwrite a user's work.

### IV. Make AI Claims Understandable

AI responses MUST distinguish proposals and inferred behavior from verified implementation
facts. A diagram alone MUST NOT be presented as evidence of what has been built.
Claims about an implementation MUST cite accessible supporting evidence when that capability
is introduced; missing evidence MUST be stated explicitly.
The integration MUST instruct the AI to acknowledge uncertain handwriting or visual
interpretations. Only user-selected context needed for the discussion MAY be exposed to
the connected AI client, and the application MUST communicate what is shared. MCP access
MUST be authorized for the specific sketch session and MUST NOT expose unrelated sessions.
Service credentials MUST NOT be embedded in client code or recorded in application logs.

### V. Validate User Outcomes with TDD

Acceptance criteria MUST cover the user's ability to draw, select, ask, interpret the answer,
and continue editing. Validation MUST include context accuracy, selection changes, and
AI request failure or unavailability. Changes to these behaviors MUST have appropriate
repeatable checks; AI response validation MUST assess relevance and grounding rather than
exact wording. Routine verification MUST use controlled responses rather than require a
live provider. Product evaluation MUST assess whether the workflow helps users find a gap
or make a decision compared with a separate whiteboard and manual screenshot sharing.
Validation MUST cover desktop mouse/trackpad input and iPhone finger input.

Context capture, immutable image snapshots, application state transitions, failure
recovery, and protection against unintended canvas mutations MUST follow test-driven
development (TDD). For new or changed behavior in these areas, write a behavioral test first,
run it and confirm that it fails for the intended reason, implement the smallest change that
makes it pass, then refactor while keeping tests green. Bug fixes in these areas MUST begin
with a failing regression test. Tests MUST assert observable behavior rather than mirror
implementation details.

Visual layout, styling, and exploratory interaction prototypes MAY use manual validation
without test-first development. Any prototype promoted into the product MUST meet the
TDD requirements above for covered behavior before completion.

## Product Scope and Constraints

The intended users are product designers and system architects. The initial product is a
single-user web canvas for freehand drawing with desktop mouse/trackpad input and iPhone
finger input. Users select a rectangular region and an authorized AI client reads its image
on demand through MCP. ChatGPT is the intended conversation and voice interface; the web app
MUST NOT require its own chat panel or voice capture/playback for this slice.

Structured boxes and arrows, automatic handwriting recognition, multiplayer collaboration,
repository connections, implementation walkthroughs, generated wireframes, and AI canvas
edits are outside the initial slice. Future capabilities MUST enter through a separate
specification with a concrete user need. Continuous image streaming is not required.

The application MUST use Next.js and Google Cloud Platform (GCP), as directed by the user.
Specific cloud services and connection mechanisms MUST be justified in the implementation
plan and limited to what this slice needs. Access protection, session pairing, and data
lifecycle rules MUST be explicit in the feature specification before release.

The spoken workflow MUST NOT be assumed feasible merely because text-based MCP tools work.
Before committing to its implementation, a capability check MUST demonstrate a ChatGPT voice
conversation reading a selected sketch image through MCP and giving a relevant spoken answer.
The check MUST document the working device arrangement, including whether iPhone use needs
a second device. If unsupported, scope MUST return to the user for a decision; text chat or
an in-app voice interface MUST NOT be silently substituted.

## Development Workflow and Quality Gates

Before implementation, the feature specification MUST define the target user task, scope,
non-goals, and observable acceptance criteria. The implementation plan MUST record a
constitution compliance check and explain any additional complexity.

Tasks MUST prioritize a complete sketch–select–discuss workflow before optional polish or
extensions. Plans and tasks MUST sequence failing tests before implementation for behavior
covered by Principle V. Change summaries MUST record the observed failure and subsequent
passing result for those tests. Review MUST verify that context sent to AI matches the visible selection at capture time,
that failures preserve work, and that no deferred capability has entered implicitly.

Before a change is considered complete, the relevant automated checks and a manual walkthrough
of the affected user workflow MUST pass. Validation results and known limitations MUST be
recorded in the change summary. Documentation-only changes require consistency checks,
not application tests.

## Governance

This constitution governs project specifications, plans, tasks, and implementation decisions.
Conflicts MUST be resolved by changing the proposal or explicitly amending this document.
Every feature specification, implementation plan, and change review MUST check compliance.

Amendments MUST state the reason, affected principles, version change, and any consequences
for existing specifications or implementation. Amendments require project maintainer review
before adoption; accepted changes MUST be propagated to affected project artifacts.

Versions follow semantic versioning: MAJOR for incompatible principle removals or
redefinitions, MINOR for new principles or materially expanded guidance, and PATCH for
clarifications that do not change obligations. Every amendment MUST update the last-amended
date; the original ratification date MUST remain unchanged.

**Version**: 2.0.0 | **Ratified**: 2026-11-05 | **Last Amended**: 2026-11-05
