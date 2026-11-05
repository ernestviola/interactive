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
