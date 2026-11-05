# Local Browser and Broker Contract

## Topology

Next.js serves UI on port 3000. Browser same-origin `/api/sketch/*` routes proxy to a dedicated
single-process Node broker on port 3001. Registry state belongs solely to that broker,
not Next.js workers or hot-reloaded modules. Desktop MCP connects directly to broker `/mcp`.
The broker binds loopback on a normal local machine. Sandbox access can require a different
bind address plus host-only port publishing; see quickstart.md.

The browser routes permit only configured local/LAN Host and Origin values. All management
requests are JSON with a custom request header, reject foreign origins and wildcard CORS,
and use no ambient authentication cookies. The operator explicitly configures the trusted
LAN origin. This is a trusted private-network experiment, not a public deployment design.

## Browser operations

All paths below are browser-facing and relative to `/api/sketch`. Except creation, they
require the browser's owner capability in the Authorization header. Tokens never go into
query strings, tool inputs, screenshots, request logs, or committed configuration.

| Method / path | Input | Output / effect |
| --- | --- | --- |
| POST /sessions | empty object | Session ID, generation, owner capability, lease expiry |
| POST /sessions/{id}/pair | empty object | New read capability; revoke prior pairing |
| POST /sessions/{id}/heartbeat | empty object | Renew lease; return last-read metadata |
| GET /sessions/{id}/capture | no body | One pending capture request, or 204 after 5s |
| POST /sessions/{id}/capture/{requestId} | generation, snapshot metadata, PNG base64 or error | Acknowledge matched active capture |
| DELETE /sessions/{id} | no body | Revoke pairing, cancel captures, remove metadata |

Creation requires same-origin validation and the private local service boundary but no app
account. Limit to four active sessions and ten creation attempts per minute per service to
bound accidental use; return 429 with Retry-After. At capacity, explain that the operator
can end another owned session or wait up to 20 seconds for a closed session's lease to expire.
At the creation-rate limit, show the supplied retry interval and preserve all existing work.
Never enumerate another session or end one automatically to free a slot. Empty or unknown IDs never enumerate
other sessions. Owner capability mismatch returns 401 with no session details.

A capture post must match session, current generation, the request's admitting pairing epoch, pending request ID, and deadline.
Validate finite revisions, ISO capture time, PNG signature/dimensions, and decoded limit
before accepting bytes. Use a 6 MiB request-body limit to cover base64 overhead for a 4 MiB
PNG. Reject mismatch/late/duplicate posts with 409 and discard their bytes.

All responses use `Cache-Control: no-store`. Reverse proxies and test harnesses must not
record request or response bodies. Health/error logs contain only operation, status,
duration, and non-secret correlation ID; never capability, path secret, ink, or image.

## Presence and cancellation

Heartbeat every 5 seconds; expire session after 20 seconds without an accepted heartbeat.
An MCP read re-checks lease and pairing at start and again before delivering a captured image.
End, expiry, restart, or pairing rotation increments/revokes the pairing epoch and cancels
in-flight requests. Recheck the original admitting epoch immediately before serialization;
an unrelated newer pairing cannot authorize an old read. No response may start after that
check fails. Cancelled MCP requests or dropped connections release their pending capture
and image references; reject subsequent browser posts for them. Revocation cannot recall
already transmitted bytes; abort any remaining transmission best effort.
Re-pairing must never restore a revoked generation. UI indicators distinguish disconnected,
paired, reading, and last sent snapshot; update that metadata after successful response flush only, never on
browser upload acceptance. Sent is not confirmed client receipt or AI understanding.

Browser close/reload sends best-effort end; the lease bounds cleanup if that fails. On iPhone
background suspension or local server restart, retain any still-open tab's strokes but create
a new session and require explicit pairing. Never automatically retarget an existing AI token.

## UI contract

- Show the session-only data warning before first editing.
- Provide labeled Draw, Select, Undo, Redo, Discard redo history, Connect, and End controls
  with visible focus. Discard redo history requires an explicit warning that redo is lost.
- On phones, use touch targets of at least 44 × 44 CSS pixels and no hover-only controls.
- Suppress scrolling only on the drawing surface; preserve access to other controls.
- Announce connection failures and read completion in an accessible status region.
- Show an exact crop preview and sharing notice before pairing or reading.
- No microphone permission, chat panel, or automatic image stream is needed.

Full nonvisual freehand authoring and assistive-device drawing are deferred; control labels,
keyboard activation, focus visibility, and status accessibility are included in this slice.

## Drawing capacity and recovery

Use the hard caps in data-model.md §Stroke and drawing state; the 500-stroke performance
fixture is not a hard limit. A rejected stroke must leave committed ink, selection, and
history unchanged. Explain whether a shorter stroke, explicitly discarding redo history,
or starting a new warned session can resolve the limit. Never require AI availability for
these recovery actions. The UI must clearly distinguish unsaved preview ink from accepted ink.
