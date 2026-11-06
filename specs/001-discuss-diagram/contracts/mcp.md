# MCP Contract: Read Selected Sketch

## Transport and authorization

Streamable HTTP at `http://127.0.0.1:3001/mcp` on the local desktop task host.
Use the official MCP SDK's supported initialization and version negotiation; pin the exact
compatible package/protocol combination during implementation and record it in pnpm-lock.yaml.
Stateless HTTP transport is sufficient; sketch pairing is application state in the broker.

Authorize each tool call with `Authorization: Bearer <read capability>` supplied by desktop
configuration through its local authentication helper (or an independently provisioned
environment variable for another client). The no-export local handoff is described in
local-session.md. Never accept secrets or arbitrary session IDs
as model arguments. Reject absent/expired/incorrect tokens with HTTP 401; no image and no
session existence disclosure. Allowlist Host and Origin where applicable for local transport.
Do not wildcard CORS, expose debug handlers, or assume a session ID proves authorization.

## Tool

`read_selected_sketch`

- Input: empty object, additional properties forbidden.
- Description: inspect the currently selected sketch region. Freehand marks may be ambiguous;
  acknowledge uncertain interpretations and do not infer verified implementation from ink.
- Annotations: `readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: false`,
  `idempotentHint: false` because subsequent reads can observe a changed drawing.
- Does not edit, clear, save, enumerate, or switch sketches.

## Success

An MCP `CallToolResult` containing:

1. A text content block with snapshot ID, drawing revision, selection revision, capture time,
   and the reminder that this is design context rather than implementation evidence.
2. An image content block with `type: image`, `mimeType: image/png`, and base64 PNG data.

Use the standard image content block, not a filename, external URL, `_meta`-only payload,
or textual description substituted for the picture. No generated narration of the expected
image answer belongs in metadata. The broker releases image data after the read completes, fails, or is cancelled. Each read
is bound to its admitting pairing epoch. Rotation/revocation invalidates pending responses;
recheck original epoch and lease before starting transmission. Already sent bytes cannot
be recalled. A flushed response may update last-sent metadata; this is not a client/model
acknowledgment.
The SDK validates content format; integration tests must confirm the desktop client consumes it.

## Errors

Validly authenticated tool failures return `isError: true` and text with a stable code and
plain-language recovery instruction. They include no image or alternative snapshot.

| Code | Condition | Recovery |
| --- | --- | --- |
| NO_SELECTION | No rectangle | Select a region in the canvas |
| EMPTY_SELECTION | Region has no ink | Select a region containing marks |
| SESSION_UNAVAILABLE | Browser expired/ended/disconnected | Reconnect and explicitly pair again |
| BUSY | Another capture is pending | Retry after it completes |
| CAPTURE_TIMEOUT | No valid result within 10 seconds | Bring canvas foreground and retry |
| CAPTURE_FAILED | Rendering/encoding failed or gesture never completed | Finish gesture, retry |
| PAYLOAD_TOO_LARGE | Image exceeds payload limits | Reduce selected area |

Malformed MCP inputs use standard protocol errors. Unrecognized tool names cannot trigger
capture. Never return the previous image as a fallback. Every retry obtains a new capture
identity, state freeze, and timestamp, even if its pixels happen to be identical.

## Acceptance

Test with two isolated sessions: a valid read token sees only its paired session; owner tokens
cannot read MCP; read tokens cannot manage sessions; revocation takes effect on every call.
Test crossed boundaries, empty images, edits while encoding, stale posts, timeouts, and PNG
schema. Confirm canvas state and undo history never change as a consequence of a read.
