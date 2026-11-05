# Research: Local Freehand Sketch and ChatGPT MCP

**Date**: 2026-11-05
**Outcome**: Documentation now establishes a desktop-local planning path. Phase 1 design
can proceed without asserting that SC-007 passed. Runtime voice/image acceptance remains a
hard product-implementation gate. No product code or live experiment was run.

## 1. ChatGPT desktop voice and local tools

**Decision**: Target a local task in the ChatGPT desktop app with live voice, local MCP,
and image-capable task context. Keep SC-007 as a runtime acceptance gate before the product
build, rather than treating a missing hosted-web integration example as a design blocker.

**Rationale**: Newly fetched official user documentation explicitly describes live voice in
Chat, Work, and Codex in the desktop app. Voice in an existing task uses that task's
conversation and selected model, under its permissions. Separate official MCP docs confirm
that the desktop app and Codex host share local server configuration, including STDIO and
Streamable HTTP. Image-input docs explicitly describe tool-assisted image inspection.
These facts establish an architectural path, not proof that this user's account can yet
execute the exact custom image tool in voice. Availability depends on rollout and workspace.

**Alternatives considered**: Hosted ChatGPT web with a tunnel (unneeded for this local-host
path); public plugin publishing (out of scope); Realtime API or in-app speech (requires
user-approved scope change). Appshots are not a substitute: they may expose content outside
our selected crop.

**Runtime evidence status**: NOT RUN. Do not claim SC-007 passed. The combined custom image
result, repeated fresh reads, actual voice, and account capability require the experiment
in feasibility.md. Documentation resolves the planning route, not those acceptance checks.

## 2. Local MCP connection

**Decision**: Local Streamable HTTP MCP at `http://127.0.0.1:3001/mcp`, configured in the
same desktop task host that runs voice. Configure a per-session read capability through
`bearer_token_env_var`, outside the conversation. No public endpoint or tunnel is required.

**Rationale**: Official MCP docs describe desktop-local HTTP servers and environment-based
bearer tokens. An HTTP server also gives Inspector a direct validation endpoint and avoids
packaging a published plugin. Pairing rotation requires reconnect/restart so the client
reloads its configured token. Client settings must be made on the desktop host, not merely
inside an unrelated sandbox or remote environment.

**Alternatives considered**: STDIO (supported, but an extra adapter is unnecessary here);
cloud ChatGPT reaching localhost (not assumed); remote MCP publishing (deferred).

## 3. No app accounts and explicit pairing

**Decision**: Use one session-bound MCP connection with a read capability provisioned out of band
by the local operator. The tool accepts no arbitrary session identifier or access secret.
The browser retains a different owner capability for management. Possessing a session ID
alone does not authorize access. End/reload invalidates pairing; never select another session
as a fallback. The final pairing contract is in contracts/local-session.md.

**Rationale**: No app login does not mean unrestricted sketch access. A local endpoint can
confine tool reads to the intentionally paired session without a full identity system.
Official auth docs describe anonymous read-only tools but do not make private customer data
safe to expose anonymously. This proposal is only for a restricted local operator experiment.
Any externally forwarded endpoint needs its own verified access boundary; do not publish
private drawings behind an unprotected anonymous endpoint.

**Alternatives considered**: OAuth accounts (outside current scope); session identifiers in
model arguments as authority (rejected); listing all sessions to AI (rejected).

## 4. Drawing and capture ownership

**Decision**: Browser memory owns stroke paths, undo/redo, and a rectangular selection.
Use Canvas 2D and Pointer Events, separate draw/select modes, and restrict touch-action
suppression to the drawing surface. A capture freezes revision, completed strokes and
selection synchronously, renders only the selected area into a detached canvas, and encodes
a PNG. A read during an active gesture either waits for gesture completion within the
request deadline or fails explicitly; it must not silently capture partial mixed state.

**Rationale**: This preserves local editing and makes cropped pixels the shared context.
The renderer used for preview and capture must have the same background, scaling, clipping,
and stroke rules. Snapshot metadata excludes coordinates and content outside selection.

**Alternatives considered**: Semantic diagram recognition (out of scope); screenshotting the
whole page then relying on AI to ignore it (privacy failure); a drawing framework (unneeded
for pen, undo, and rectangular selection).

## 5. On-demand relay and image lifecycle

**Decision**: Use a dedicated single local Node broker with in-memory session/pending-request state,
separate from the Next.js development server. Next routes proxy browser requests to it;
MCP talks directly to its /mcp route. This avoids losing the registry on Next hot reload.
The browser polls its owner-protected capture channel. An MCP read queues a request; the
browser posts a crop bound to request ID, session generation, drawing revision, and selection.
The relay forwards the image to that read and removes references when complete or failed.
Do not keep a latest-image cache. Use no-store headers, omit bodies and capabilities from
logs/traces, disable payload recording in test artifacts, and never write PNGs to disk.

**Rationale**: MCP cannot directly execute code in a user's browser. A short-lived capture
request channel bridges that gap without storing the drawing on a server. Images already
sent to ChatGPT are governed by ChatGPT retention and cannot be recalled by this app.

**Failure constraints**: One pending read per session; proposed 10-second capture deadline;
reject late/duplicate responses and stale session generations. Session leases must expire
when the browser stops communicating; unload events alone cannot guarantee revocation.
Use a 5-second heartbeat and 20-second lease; expose expired pairing clearly to users.
A backgrounded iPhone may suspend communication; return unavailable instead of stale images,
then re-pair explicitly if its session lease expired, preserving any still-open local drawing.

**Alternatives considered**: Persistent cloud object storage (out of scope); continuous image
streaming (out of scope); indefinite image caching or unbounded request queues (rejected).

## 6. Toolchain and hosting

**Decision**: Use TypeScript, a compatible stable Next.js/React release on Node.js 24 LTS,
official MCP TypeScript SDK, Vitest, and Playwright. Pin exact compatible versions when the
experiment is implemented. Keep one local package; defer GCP provisioning.

**Rationale**: Next.js and GCP were user constraints; the later local-hosting instruction
controls this slice. No Node/npm is installed in this sandbox, including fresh login shells.
No tools were installed during planning. Cloud services are unnecessary for the experiment.

**Alternatives considered**: Separate cloud backend and database (premature); native mobile
app (outside web scope); direct paid AI API integration (ChatGPT is the intended client).

## 7. Validation strategy

**Decision**: Use fail-first behavior tests for crop boundaries, immutable revision capture,
state transitions, authorization and revocation, timeout/retry coordination, and read-only
canvas guarantees. Use controlled MCP clients and images for routine checks. Use physical
mouse/trackpad and iPhone Safari for acceptance and actual ChatGPT voice for SC-007.

**Rationale**: Exact spoken wording is unstable; verify grounded visual interpretation and
freshness instead. Tool metadata must not disclose the image answer and let a test pass
without visual reasoning. Browser touch emulation is useful but is not real iPhone evidence.

## Sources and limitations

Fetched official OpenAI documentation:

- [Test your integration](https://developers.openai.com/apps-sdk/deploy/connect-chatgpt):
  MCP connection methods, private/local testing, account/workspace conditions, Inspector.
- [Build an MCP server](https://developers.openai.com/apps-sdk/build/mcp-server): official
  SDKs, MCP endpoint and result structures; not proof of voice image compatibility.
- [Authentication](https://developers.openai.com/apps-sdk/build/auth): anonymous read-only
  tools and server-enforced authorization for protected data.

Next.js installation/route-handler docs and MDN Pointer Events docs could not be fetched:
network responses said approval was required for nextjs.org:443 and developer.mozilla.org:443.
No bypass was attempted. Consequently exact framework guidance and browser edge behavior
are not claimed verified from those pages. Read-only npm registry metadata was subsequently
available and confirmed the proposed engine/peer baseline below; no package was installed.

Newly fetched primary sources resolving the desktop-local route:

- [ChatGPT Voice](https://learn.chatgpt.com/docs/features/voice): desktop live voice,
  existing-task context/model, permission inheritance, rollout and account conditions.
- [Model Context Protocol](https://learn.chatgpt.com/docs/extend/mcp): desktop host MCP setup,
  local Streamable HTTP/STDIO, environment bearer-token configuration.
- [Image inputs](https://learn.chatgpt.com/docs/image-inputs): desktop tool-assisted visual
  inspection of images and diagrams.

The previous requirement for a tunnel was too broad: hosted ChatGPT web differs from a
local task in the desktop app. No claim is made that all desktop accounts have voice enabled.
Exact custom-tool image behavior remains runtime acceptance, not an unanswered design choice.
This run has no live user voice session and, by instruction, does not implement a test server.

## Dependency metadata checked without installation

Fetched the public npm registry `/latest` metadata on 2026-11-05. Proposed fixed baseline:

| Package | Version | Relevant compatibility |
| --- | --- | --- |
| next | 16.4.5 | Node >=20.9; React 19 supported |
| react / react-dom | 19.3.1 | Matches the Next React peer range |
| @modelcontextprotocol/sdk | 1.32.2 | Node >=18; Zod 4 supported |
| zod | 4.6.7 | Matches MCP SDK peer range |
| typescript | 7.0.2 | Node >=16.20 |
| tsx | 4.23.15 | Node >=18 |
| vitest | 5.1.0 | Node 24 supported |
| @playwright/test | 1.64.1 | Node >=20 |

Sources: registry.npmjs.org metadata for each package. This is manifest-level compatibility,
not proof of installation, typechecking, Next build, browser runtime, or MCP interoperability.
During implementation, lock and validate the baseline; adjust an incompatible transitive
or compiler dependency with recorded evidence. No package.json or lockfile was created.

## Device and measurement decisions — 2026-11-05

**Decision**: macOS Chromium and Safari, plus physical iPhone 12 Safari; record actual Mac
hardware and installed OS/browser versions before acceptance. Use external high-frame-rate
recording for conservative physical-input-to-visible feedback. Browser scheduling timestamps
and animation-frame callbacks are diagnostic proxies, not proof of visible presentation.
See validation.md for the fixed protocol and its uncertainty rules.

**Rationale**: The user specified these targets; inventing a Mac model or substituting
emulated touch for iPhone 12 would misstate the baseline. Explicit recording conditions
make performance results reproducible without another product-scope question.

**Alternatives considered**: Expanding to Edge/Android/tablets (outside current target);
claiming a repaint callback measures actual display latency (rejected); prescribing an
unprovided Mac model (rejected). No browser or device measurement ran during planning.

**Capacity decision**: Limit the local prototype to 1,000 strokes including redo, 2,000 points
per stroke, and one million total stored points. Reject a whole new stroke on overflow,
preserve prior work, and provide explicit discard-redo or new-session recovery. These are
planning defaults, not measured capacity claims; the 500 × 1,000 performance fixture is separate.

## Package manager decision — 2026-11-05

**Decision**: Use pnpm exclusively, pin its exact compatible version during implementation
in package.json packageManager, and commit pnpm-lock.yaml. Locked verification uses
pnpm install --frozen-lockfile; scripts use pnpm run and temporary tools use pnpm dlx.

**Rationale**: Explicit user preference. The npm registry references above identify the
metadata source, not a choice to use the npm package manager. Compatibility still requires
the planned locked install/build checks; no installation was performed for this amendment.

**Alternatives considered**: npm/package-lock.json (superseded by user direction), multiple
package managers/lockfiles (rejected to keep dependency resolution consistent).

## Experiment tooling verification — 2026-11-05

Installed the proposed exact TypeScript 7.0.2, tsx 4.23.15, MCP SDK 1.32.2,
Zod 4.6.7, and Vitest 5.1.0 baseline. Pinned pnpm 10.34.9 with Node.js 24.22.2;
selected the maintained pnpm 10 line for the conventional JavaScript bootstrap.
Pinned @types/node 24.10.0 for the Node 24 API target. Frozen lockfile installation
and strict TypeScript checking passed. No product dependencies have been added.
Inspector 2.14.0 is pinned in the convenience script but has not been installed/run.

pnpm reports that esbuild's install script was ignored. This did not prevent the compiler
or Vitest runner from starting; tsx execution and a working esbuild transform must still
be verified when implementing the experiment. No blanket build-script approval was added.
