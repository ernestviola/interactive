# Implementation Plan: Discuss a Freehand Sketch

**Branch**: `001-discuss-diagram` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-discuss-diagram/spec.md`

**Status**: Runtime gates A and B PASS. Core canvas/history/provenance/recovery and
on-demand verification are implemented. Final verification passes 44 unit/contract checks,
22 Chromium/WebKit scenarios, typecheck, lint, and production build. The physical iPhone 12
voice workflow and core phone interactions were observed. Native Safari/Chrome functional checks also pass.
The operator waived physical performance measurements and participant/reviewer runs for
this iteration. The spec is closed under that revised acceptance scope; these are waivers,
not passing measurements. Details remain in validation-results.md and pilot-results.md. The user explicitly requested tests on demand, not on every commit.

## Summary

Build a local Next.js drawing surface for designers and architects using a mouse/trackpad
on desktop or a finger on iPhone. Users select a rectangle; a session-bound, read-only MCP
tool returns a transient image for discussion in ChatGPT. No app accounts, persistent
storage, structured diagram recognition, embedded chat, or voice implementation are planned.

First validate that the intended ChatGPT voice client can call a custom MCP tool, interpret
an image returned by that tool, and inspect a changed image during the same conversation.
Official documentation now establishes desktop live voice in a local task, local MCP
configuration in that task host, and tool-assisted image inspection. Use that documented
route instead of the hosted-web/plugin route. This permits design planning, not an assertion
that the exact combined interaction has been tested. Product implementation MUST NOT proceed
until the staged evidence in [feasibility.md](feasibility.md) satisfies SC-007. If it fails, return the scope decision to the user.

## Technical Context

**Language/Version**: TypeScript 6.0.3 in strict mode; pnpm-managed Node.js 24.22.1. The compiler compatibility adjustment is recorded in research.md.

**Primary Dependencies**: Next.js App Router and React for the local web app; browser Canvas
2D and Pointer Events for ink; official `@modelcontextprotocol/sdk` for a local Node MCP broker.
Manifest-checked baseline: Next 16.4.5, React 19.3.1, MCP SDK 1.32.2, TypeScript 6.0.3 (adjusted after actual ESLint incompatibility),
Zod 4.6.7, tsx 4.23.15, Vitest 5.1.0, Playwright 1.64.1. Pin and verify pnpm-lock.yaml during
implementation; see research.md for engine/peer evidence and its limits. No drawing
framework, AI API client, or speech SDK is required by the proposed design.

**Package Manager**: pnpm, selected by the user. Pin a Node.js 24-compatible exact release
in package.json packageManager during setup; use pnpm-lock.yaml exclusively and
`pnpm install --frozen-lockfile` for reproducible verification.

**Storage**: Browser-tab memory for strokes, undo history, selection, and owner capability;
a dedicated broker process for pairing and pending reads. Images exist only during a read and are
released afterward. No database, disk images, localStorage, or durable snapshot cache.

**Testing**: Vitest for state and capture coordination, Playwright for browser integration
and desktop/WebKit touch emulation, MCP SDK test client for contract checks, plus real iPhone
Safari and actual ChatGPT voice tests. Emulation does not replace physical-device acceptance.

**Target Platform**: macOS with Chromium and Safari; physical iPhone 12 with Safari. Local host
serves the browser over a trusted private network. ChatGPT may run on a second computer.

**Project Type**: Local Next.js web application and single-process Node MCP broker; no cloud deployment.

**Performance Goals**: The original SC-004 physical p95 target was explicitly waived for this iteration; no measured latency claim is made. The implemented capture deadline is 10 seconds with explicit failure.

**Constraints**: One diagram per browser session; explicit rectangular selection; immutable
on-demand images; no full-canvas fallback; no persistent image logging; no app login.
MCP access must still be limited to the explicitly paired session. GCP is the intended future
cloud platform; the user's later local-only instruction defers provisioning. Constitution v2.0.0 governs this plan and the synchronized planning inputs.

**Scale/Scope**: One local operator, trusted local devices, one active read per paired session.
Multiple browser sessions must remain isolated. No public service or production SLA.

**Connection Decision**: ChatGPT desktop local task host → Streamable HTTP at
`http://127.0.0.1:3001/mcp`; the local authentication helper obtains the explicitly paired session’s volatile read capability. No shell exports or clipboard transfer are needed. Next.js on
port 3000 proxies browser management to the broker. iPhone uses the desktop host's trusted
LAN address for the web app; it does not need a local ChatGPT MCP configuration.

**Runtime Acceptance Dependency**: The target account must have desktop live voice and local
MCP enabled, and the custom image tool must work during that voice session. Documentary
support resolves the route; both mandatory runtime gates passed, with actual-client evidence in feasibility.md.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle or constraint | Pre-research result | Required evidence or design obligation |
| --- | --- | --- |
| I. Smallest useful workflow | PASS for research | One sketch–select–discuss slice; feasibility first |
| II. Canvas-grounded context | PASS for proposed direction | Crop only selected pixels; immutable revision and snapshot identity |
| III. User control | PASS for proposed direction | Read-only MCP, no AI canvas mutations, local editing through outages |
| IV. Understandable claims | PASS for proposed direction | Acknowledge ambiguous ink; pair one session; no unsupported implementation claims |
| V. TDD | PASS for planned sequencing | Observe failing behavioral tests before covered implementation |
| Next.js and GCP | PASS | Next.js retained; GCP deployment deferred by explicit local-only instruction |
| Desktop voice/local MCP planning route | PASS for design | Official desktop voice, MCP, and image docs; exact workflow remains runtime acceptance |
| Product implementation readiness | PASS after runtime gates | SC-007 actual-client evidence is recorded in feasibility.md |

Post-design re-check: PASS for design compliance. The data model and contracts enforce
selected-only immutable snapshots, read-only AI access, session isolation/revocation,
transient images, local input support, and fail-first validation sequencing. There is no
additional implementation exception. SC-007 subsequently passed both runtime gates before broader product work. Participant and physical-latency evaluation were later explicitly waived by the operator, as recorded in spec.md.

## Project Structure

### Documentation (this feature)

```text
specs/001-discuss-diagram/
├── spec.md
├── planning-inputs.md
├── plan.md
├── research.md
├── feasibility.md
├── data-model.md
├── validation.md
├── quickstart.md
├── contracts/
│   ├── mcp.md
│   └── local-session.md
└── checklists/requirements.md
```

The design artifacts above and the implementation tasks in tasks.md are present. Runtime evidence and current acceptance dispositions are recorded separately.

### Source Code (repository root)

Implemented source layout:

```text
src/
├── app/                 # Next.js page and local session/capture route handlers
├── components/          # Drawing surface, selection preview, sharing/connection controls
├── lib/
│   ├── drawing/         # Stroke state, undo/redo, crop rendering
│   └── contracts/       # Shared capture and result types
└── broker/              # Session registry, capability checks, capture relay, MCP endpoint

tests/
├── unit/
├── contract/
└── browser/
```

**Structure Decision**: Keep the local web app and broker in one TypeScript package, sharing
only capture/result types. Avoid a database, remote backend, and separate frontend project.
The broker owns all registry state and is independent of Next hot reload. Only /mcp is
configured in the desktop client; browser management requires a separate owner capability.
See contracts/ for the selected transport, paths, limits, and lifecycle.

## Complexity Tracking

No constitution violations are accepted. The only extra process proposed is the MCP broker,
needed to let an external client request a live browser crop without exposing session
management. A cached screenshot service was rejected because it would violate freshness
and transient image requirements.

## Execution Boundaries

1. Execute only the disposable image/MCP experiment described in feasibility.md first.
2. Record real client, connection method, image-call evidence, and spoken observations.
3. If successful, validate the documented design against actual client behavior, then
   demonstrate a minimal selected-canvas read before proceeding beyond feasibility.
4. Generate tasks when requested, with test-first ordering for crop correctness, revision consistency,
   session authorization, revocation, stale results, timeouts, and mutation protection.
5. Implement the product only after these gates; record failing and passing test evidence.

The original planning phase created no application runtime. Implementation subsequently delivered the local app and broker after the documented live gates; no cloud deployment was added.

## Requirements Traceability

| Requirements | Design and validation |
| --- | --- |
| FR-001–FR-003 | Browser ink state, explicit modes, undo/redo, rectangular crop; real-device walkthrough |
| FR-004–FR-007 | Exact preview, atomic detached render, revisions, PNG image result; crop/immutability tests |
| FR-008–FR-011 | Typed errors, fresh retries, 10s deadline, last-sent metadata; outage/race tests |
| FR-012–FR-013 | MCP description for uncertain ink; ChatGPT desktop voice; no embedded conversation UI |
| FR-014–FR-016 | Owner/read capabilities, lease/end revocation, no-store transient payloads; isolation tests |
| SC-001–SC-006 | Pilot, grounded-response review, performance and failure scenarios in quickstart.md |
| SC-007 | Staged controlled-image and minimal live-canvas evidence in feasibility.md |

## Device and Review Refinement — 2026-11-05

User targets: macOS desktop with Chromium and Safari, and iPhone 12 Safari. Treat the phone
as a real-device acceptance target; WebKit emulation is supplemental. Record actual Mac
model and installed OS/browser builds before tests; no extra product decision is needed.

The five readiness findings are resolved in the written design: FR-011 uses last-sent
terminology; validation.md defines matched tasks, grading, and physical visible-latency
measurement; content caps and recovery are explicit in the data model/contracts; stale
requirements-checklist notes are reconciled. The prior checklist evaluation remains a
historical review; its five open items were re-evaluated under the earlier explicit review
request, with evidence recorded in readiness-review.md. All 33 written criteria now pass.

Post-refinement constitution check: PASS for documentation/design. TDD obligations, local
scope, selected-only image sharing, session revocation, and the SC-007 runtime gate remain.
SC-007 later passed, and Next.js, the broker, and planned interfaces are implemented. Current completion is subject to the explicit participant/performance waivers above; neither waived outcome is claimed as passed.
