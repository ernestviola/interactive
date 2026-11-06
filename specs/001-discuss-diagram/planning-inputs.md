# Planning Inputs: Discuss a Selected Diagram

Recorded 2026-11-05 from the user's explicit instructions:

- Use Next.js for the application.
- Use Google Cloud Platform (GCP) as the cloud service.

These are mandatory inputs to the implementation plan. Specific GCP services, deployment
configuration, AI provider, and storage choices have not been selected. They must be chosen
only as needed for the specified slice. No implementation or deployment is authorized by
this specification workflow.

The plan and tasks must follow constitution v2.0.0, including test-first sequencing for
covered behaviors and controlled AI responses for routine verification.

## Later scope decisions

The user subsequently selected local hosting with no app logins. GCP remains the future
cloud platform and does not require provisioning for this slice. The implementation plan
selects a ChatGPT desktop local task host for voice and direct local MCP access, with iPhone
browser drawing allowed alongside desktop voice. Runtime SC-007 evidence is still required;
no public plugin publishing, tunnel, app speech implementation, or cloud deployment is implied.

## Device targets confirmed 2026-11-05

The user specified macOS, iPhone 12, Chromium, and Safari. Plan macOS Chromium and Safari,
and iPhone 12 Safari; do not require Chromium on iOS. Record actual OS/browser builds and
Mac hardware before validation. Same-iPhone voice/drawing remains outside the first slice.

## Package manager confirmed 2026-11-05

Use pnpm for setup, dependency changes, scripts, and verification. Commit pnpm-lock.yaml
as the sole dependency lockfile. Pin a Node.js 24-compatible exact pnpm version in
package.json packageManager during setup; use pnpm install --frozen-lockfile for locked
installs. This decision does not authorize toolchain installation during planning.

## Implementation follow-up — 2026-11-05

The operator requested no repeated shell-variable exports. Startup now uses the pnpm-managed
Node runtime and private local authentication helper; native-client session handoff is volatile.
The operator also requested routine walkthrough cases be automated and run through an explicit
command when relevant, **not on every commit**. `pnpm run verify` is the full on-demand gate;
focused scripts remain available. This does not turn unmeasured physical performance or the
unrun target-user pilot into passing results. Both live voice feasibility gates were actually
observed before broader product implementation.

## Acceptance scope decision — 2026-11-05

The operator explicitly waived participant testing and then physical latency measurements
for this first spec. SC-001, SC-004, SC-005 and the formal target-user grading portion of
SC-006 are waived for this iteration, not passed. No five-user results, measured p95, or
ten-answer grade is claimed. The completed functional checks and observed live voice
results remain valid. These waivers close the remaining acceptance gates for this spec;
future releases may reinstate the retained protocols.
