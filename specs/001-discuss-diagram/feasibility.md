# Feasibility Gate: ChatGPT Voice Reading MCP Sketch Images

**Status**: Gate A PASS. Gate B PASS for the verified two-device arrangement: physical
iPhone 12 Safari drawing with desktop live voice on the operator’s Mac.
T001–T005 are complete. The actual desktop connection, one operator-confirmed live voice
image read, a fresh text-chat baseline, and two changed-image reads in one live voice
conversation pass. A read after the operator stopped the server returned an explicit
transport failure and no image. T007–T016 may now proceed; T018 onward remains gated on T017.
**Requirement**: SC-007; constitution v2.0.0 Product Scope and Constraints.

## Goal

Prove that the intended ChatGPT voice interface can call a custom MCP tool and explain its
returned image aloud, then request and describe a different image within the same voice
conversation. Prove the actual visual path before implementing a drawing product around it.

## Minimal experiment boundary

Use a disposable read-only MCP tool named `read_selected_sketch` with an empty input object.
It returns an MCP image content block (`image/png`) plus text containing only snapshot identity
and capture time. Render a synthetic, non-sensitive sketch and change it between calls.
Do not expose a real drawing, add voice to the web app, build accounts, or provision GCP.

The synthetic fixture must have an independently recorded expected answer, such as a random
symbol and short code visible only inside the image. Do not put that answer in tool metadata,
file names, IDs, text results, or instructions. Do not persist runtime image copies.

If local experiment code is written later, first confirm failing tests for snapshot identity,
updated-image behavior, request errors, and read-only guarantees. This planning run does not
create or execute that code. Install a compatible Node.js toolchain and pin the MCP SDK then.

## Prerequisites

- The intended ChatGPT account/workspace can add the custom MCP connection and use voice.
- A microphone, voice-capable ChatGPT client, and operator access to connection settings.
- A local task in the ChatGPT desktop app, using the same host's Streamable HTTP MCP
  configuration at http://127.0.0.1:3001/mcp with an out-of-band bearer capability supplied
  by the local authentication helper (the no-export setup described below).
  This route needs neither public publishing nor a tunnel. Hosted ChatGPT web is a different
  connection surface and is not the initial target.
- Official setup guidance: [MCP](https://learn.chatgpt.com/docs/extend/mcp) and
  [Voice](https://learn.chatgpt.com/docs/features/voice).
- Local tools must first be inspected with MCP Inspector. The expected command, after a
  working Node installation and test endpoint exist, is `pnpm dlx @modelcontextprotocol/inspector`.
  Record/pin the Inspector version used for the experiment. Use its UI to connect to the experiment's actual endpoint or configured local transport.
- When testing later in this sandbox, a server must bind to 0.0.0.0 for published host access.
  The operator publishes the web app port for LAN access and the MCP port to host loopback
  only; exact commands are in quickstart.md. iPhone uses the host LAN address, not its own
  localhost. Port publishing makes the local endpoint reachable; the desktop task must still
  be explicitly configured and paired to use it.

## Procedure

1. Record date, ChatGPT client/version, device, account/workspace capability, and connection
   method without copying account identifiers, credentials, or tokens into the report.
2. Inspect the MCP tool directly: confirm a PNG content block, fresh snapshot identity, and
   capture time. Confirm that a failed request returns a clear error rather than cached data.
3. Connect the local endpoint in the desktop task host settings, pair its token out of band,
   and confirm the tool is available in that task before starting voice.
4. In ordinary text chat, ask it to inspect the sketch and describe the hidden-in-image code
   and symbol. Verify a real tool call and correct visual interpretation. This is only a baseline.
5. Start an actual voice conversation with the integration available. Ask aloud to inspect
   the selected sketch. Verify the MCP call occurs after this spoken request and that the
   spoken response correctly describes the image's code and symbol.
6. Change the image to a different code and symbol without changing the tool description.
   Ask aloud to inspect it again in the same conversation. Verify a fresh tool call, new
   snapshot identity, and a spoken answer grounded in the changed image.
7. Disconnect the MCP server and request another read. Verify an explicit unavailable result;
   do not count an answer from stale conversation context as a successful read.
8. Record whether the desktop voice arrangement works. Once a minimal canvas exists, repeat
   with iPhone drawing and desktop ChatGPT voice before claiming the full SC-007 acceptance.
   A synthetic-image success permits the minimal live-canvas feasibility slice, not the
   unrestricted product build. Phase 1 design is already documented conditionally.

## Evidence record

| Check | Current result | Evidence required |
| --- | --- | --- |
| Local tool returns a correct image | SDK contracts and Inspector CLI PASS | Eight contracts plus two changed-image reads through Inspector 2.14.0; see test-evidence.md |
| Actual account can connect | PASS | `interactive` tool successfully called in this desktop task |
| Text chat sees the image | PASS | Fresh MCP image read at 2026-11-05 23:54:09.580 UTC; interpreted from returned pixels |
| Voice triggers tool and sees image | First read PASS | Live voice read at 2026-11-05 23:50:48.235 UTC; operator explicitly confirmed the spoken shape and digits |
| Second spoken read sees changed image | PASS | Two distinct snapshots in one live voice session; changed second interpretation explicitly confirmed by operator |
| Failure does not masquerade as fresh read | PASS | After operator stopped server, actual integration call returned isError=true and no image |
| Full selected-canvas workflow | PASS for two-device arrangement | Physical iPhone 12 Safari and Mac live voice; changed second crop confirmed |

Record only non-sensitive metadata and observations. Avoid body logging or screenshots that
contain pairing secrets. Neither Inspector nor text-chat success alone passes the voice gate.

## Implementation host and toolchain — 2026-11-05

Implementation runs directly on the desktop macOS host, rather than the earlier planning
sandbox. Observed OS: macOS 26.5.1 (25F80), Darwin arm64. Installed
`/Applications/ChatGPT.app` reports version 26.1021.31345. Account/workspace, microphone,
live voice availability, and task MCP access were **unverified at initial setup**. Subsequent
actual connection and first voice-call evidence is recorded below. Physical iPhone 12 access
remains unverified. A sandboxed hardware-model query was denied; no model is invented.

System PATH initially selected Node 26.12.1. The bundled local runtime supplies Node
**24.22.1**, used for all recorded experiment checks. pnpm **12.15.0** is pinned in
package.json. Dependencies are locked in pnpm-lock.yaml. No global toolchain change was needed.

## Run the implemented controlled-image experiment

Use pnpm 12.15.0. The package manager installs and selects pinned Node 24.22.1
via package.json `devEngines.runtime`; no PATH export is needed. The experiment binds
**loopback only**.

```sh
pnpm install --frozen-lockfile
pnpm run test:contract
pnpm run typecheck
pnpm run experiment:voice
```

On first start the experiment creates `.env.voice.local` with a random 256-bit read
capability and owner-only (0600) access. This is operator configuration, ignored by Git;
it is reused on later starts. It contains no images, fixture answers, or session data.
Malformed or insecure configuration is rejected without printing or replacing its contents.
This update implements the user's explicit request to avoid repeated environment exports.
Automated tests and Inspector verification still generate disposable in-memory credentials.

The server prompts for a symbol (`circle`, `square`, or `triangle`) and exactly four digits
in its private terminal. Choose a fresh answer, retain it independently, and enter it there.
The server starts only after that input. It does not print or embed the answer in tool
metadata. For the second read, enter a **different symbol and code** in the same terminal.
Source image data and PNGs exist only in process memory; no image files/cache are created.

Add the desktop MCP entry **once**, using `experiments/voice-mcp/config.example.toml`.
It connects to `http://127.0.0.1:3001/mcp` and uses the local `auth-headers.ts` helper to
read the private configuration directly. The helper's stdout is the host's credential
channel; do not invoke it in a chat or record its output. Remove an older
`bearer_token_env_var` or static Authorization header from that entry, since explicit
credentials take precedence over helper output. No shell exports or launchctl environment
changes are needed. Restart/reconnect the MCP entry after adding it. The helper uses
native TypeScript support in the installed Node (24 or newer), without package dependencies.
For a different checkout, adjust its absolute path in the example.

To rotate the experiment credential, stop the server, delete `.env.voice.local`, restart
the server, and reconnect MCP. This reusable operator credential is specific to the
synthetic experiment; it does not change the future canvas's per-session pairing lifecycle.

Inspect the endpoint using pinned Inspector **2.14.0**:

```sh
pnpm dlx @modelcontextprotocol/inspector@2.14.0
```

Connect using Streamable HTTP and the bearer capability in Inspector's private
authentication controls. If the browser connection forwards an Origin header, explicitly
permit only the actual Inspector origin using `SKETCH_ALLOWED_ORIGINS` before starting
the experiment (for example `http://localhost:6274`). No wildcard CORS is enabled.

Then perform procedure steps 4–7 above. The server reports only a `read_sent` event with
numeric MCP call ID, random snapshot ID, and capture timestamp **after response flush**.
Record these metadata and an operator assessment of the spoken interpretation; never copy
raw tool results, tokens, or runtime images into evidence. Stop the server with Ctrl-C
for the disconnection scenario. A controlled SDK test is not the actual text baseline or
live voice observation.

Inspector CLI verification, actual task connection, text baseline, and one operator-confirmed
spoken image read are complete. A changed second image in one live conversation and actual
disconnection behavior remain pending. Their absence blocks T006; it is neither unsupported
behavior nor a pass. T007–T042 remain gated.

The initial verification servers were temporary and stopped after their checks. The operator
subsequently started the experiment and installed the `interactive` MCP entry. The server was
reachable for both actual reads below. Future runs still require the operator's server to run.

## Actual conversational evidence — 2026-11-05

The MCP tool was invoked through the configured `interactive` integration, not through a
shell SDK substitute. Its result contained an image/png block and text with only opaque
snapshot identity/capture time. The interpretation came from the image. No image files,
capabilities, or fixture answers are copied into this evidence record.

| Observation | Snapshot identity | Capture time (UTC) | Result |
| --- | --- | --- | --- |
| Actual desktop live voice read | `33de646b-e545-4c3d-89bc-d356686d4365` | 2026-11-05 23:50:48.235 | The spoken reply identified the shape and all four digits; the operator confirmed it was exactly what they entered |
| Ordinary text-chat baseline | `0ea86568-fc7e-4bc1-8fe6-a79e828e2d22` | 2026-11-05 23:54:09.580 | A new tool call returned a fresh snapshot with the same current pixels, correctly interpreted |

Device arrangement: operator's local macOS desktop task with live voice and a separate terminal
running the loopback experiment. Physical iPhone drawing has not been tested. The initial
installed app build is recorded above; an active-client build was not independently rechecked
during the voice call. The server's numeric request ID was not included in the tool result
and was not captured; the returned snapshot IDs and capture times are the available call
correlation evidence. The user confirmed the spoken interpretation in the live transcript.

The voice session ended before a changed-image second read. The later text baseline does
not satisfy that voice requirement. Resume a live conversation, read one current fixture,
change both symbol and digits privately, then request another read in that same conversation.
Finally stop the experiment and request another read to demonstrate explicit unavailability.
T006 remains unchecked until the required observations are complete.

### Same-conversation freshness test completed

In a resumed live voice conversation, a fresh first read returned snapshot
`76bde775-2568-4968-a0dc-7094208c46ff` at 2026-11-05 23:56:04.884 UTC. The operator
then changed both the symbol and digits privately while keeping that conversation open.
Their spoken recheck request triggered a second actual MCP call, returning snapshot
`b6f6ffa2-7e9c-41fa-9ccf-1bd928048e23` at 2026-11-05 23:56:39.756 UTC. The spoken
reply correctly identified the changed shape and all digits; the operator explicitly
confirmed it. No fixture answer was available in the tool's text metadata. This passes
the required changed-image live voice behavior. The actual disconnected-read scenario is
the only remaining Gate A observation. No full selected-canvas or physical iPhone pass
is inferred from this controlled fixture.

### Gate A completion

The operator confirmed that the experiment process exited. A subsequent actual
`interactive/read_selected_sketch` request in the same live voice session failed at
the HTTP transport, returning `isError: true` with **no image**. Observed time:
2026-11-05 23:57:41 UTC. The reply reported current unavailability rather than describing
the earlier snapshot as a new read. This completes Gate A / T006. Historical partial
status notes above describe the earlier stages and are superseded by this result.

Proceed only to the minimal selected-canvas slice. The next gate requires actual selected
canvas captures with desktop voice and physical iPhone 12 drawing, including a changed
second crop. This controlled-image pass does not complete SC-007 for the product.

## Decision rules

- If account access, tool invocation, returned-image interpretation, or fresh second voice
  read is unsupported: mark the gate FAILED/UNSUPPORTED and return to the user for scope.
- If the test cannot run because the account or client is unavailable: mark BLOCKED, not PASS.
- If voice/image behavior succeeds with controlled images: record that evidence and proceed
  only to the minimal live-canvas feasibility slice. Keep full selected-sketch SC-007 validation as a prerequisite to proceeding
  beyond the minimal live-canvas feasibility slice into the product build.
- Do not substitute dictation into text chat, reading a text answer aloud, an API Realtime
  demo, or built-in camera/screen sharing for the required custom MCP voice workflow.

## Resuming planning

The conditional data-model.md, contracts/, and quickstart.md now exist. Record runtime
results here and reconcile them with the design before product implementation. `$speckit-tasks`
may sequence a separately authorized feasibility slice ahead of the gated product work. If unsupported, use `$speckit-clarify` to record the user's revised
scope, and amend the constitution if that scope changes its first-slice obligations.

## Gate B / T017 PASS — physical selected-canvas workflow

Actual integration calls in one desktop live voice conversation captured the operator's
phone selection:

| Snapshot | Captured at (UTC) | Drawing / selection revision | Observation |
| --- | --- | --- | --- |
| `2d2e0062-ff1a-4e08-8a73-5c1460d1783a` | 2026-11-06 00:24:15.519 | 9 / 3 | Spoken interpretation described the actual freehand marks and uncertain lettering; operator confirmed the selected content |
| `057c6fa3-3026-457a-b3e4-9ec52819b024` | 2026-11-06 00:25:19.523 | 13 / 4 | A fresh tool call returned changed drawing and selection; operator confirmed the new spoken interpretation |

The operator explicitly confirmed **physical iPhone 12, Safari, and live voice on this Mac**.
The web app supplied only the selected crop and did not request a screenshot upload. The
second result had a new identity, time, and revisions. AI did not modify the drawing.
No image, credential, or actual fixture answer is stored in these evidence files. Exact
iOS/Safari builds and physical input latency were not measured; those remain final
validation requirements. Desktop automated Chromium/WebKit checks separately pass, while
a complete manual macOS browser walkthrough remains part of T022/T041.

SC-007 is PASS for this observed supported arrangement. This permits T018 onward. It does
not imply pilot, accessibility, performance, full-history, or recovery acceptance passed.
Historical NOT RUN / partial notes above record prior stages and are superseded here.
