# Feasibility Gate: ChatGPT Voice Reading MCP Sketch Images

**Status**: NOT RUN. This is an experiment protocol, not evidence of supported behavior.
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
  configuration at http://127.0.0.1:3001/mcp with an environment-provided session bearer token.
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
| Local tool returns a correct image | Not run | Inspector result and snapshot metadata |
| Actual account can connect | Not run | Tested connection method and client |
| Text chat sees the image | Not run | Tool-call evidence and correct interpretation |
| Voice triggers tool and sees image | Not run | Call timestamp/ID and spoken interpretation |
| Second spoken read sees changed image | Not run | New snapshot ID and changed interpretation |
| Failure does not masquerade as fresh read | Not run | Explicit failure observation |
| Full selected-canvas workflow | Not run | Later real selection capture, desktop/iPhone setup |

Record only non-sensitive metadata and observations. Avoid body logging or screenshots that
contain pairing secrets. Neither Inspector nor text-chat success alone passes the voice gate.

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
