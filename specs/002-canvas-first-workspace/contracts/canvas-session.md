# Canvas Session and AI Read Contract

This contract describes observable behavior for the existing local Next.js proxy, loopback broker, browser tabs, and configured MCP helper. It does not prescribe a public cloud API.

## Browser session operations

- Opening the canvas creates or resumes one transient drawing session and makes it readable by the configured local helper. There is no Connect or region-selection operation.
- A duplicated tab joins the same `sessionId` with its own ephemeral tab presence. The current drawing and 50-step history synchronize without manual action. Each tab may navigate its viewport independently.
- A reload retains the tab's session checkpoint and rejoins the session. If the broker restarted, the browser may obtain a fresh generation for the same local drawing; old grants are invalid.
- Each live tab renews presence. Closing a tab may send a best-effort detach. The broker revokes immediately after the last confirmed detach or on lease expiry; correctness must not depend on a close event.
- If storage cannot safely checkpoint an action, the action is not acknowledged as committed and the earlier drawing remains intact.

The existing `/api/sketch/sessions` proxy and broker endpoints may evolve to accept tab identity and return session generation, lease, and owner capability. Owner capability is sent only through the same-origin browser proxy to the loopback broker. The local helper's bootstrap capability remains separate and never appears in the canvas page.

## Cross-tab drawing messages

Messages on the same-origin session channel have these logical shapes:

| Message | Required fields | Result |
| --- | --- | --- |
| `join` | session ID, tab ID, known revision | Coordinator responds with current document if newer |
| `intent` | action ID, tab ID, action kind, payload | Coordinator orders the action |
| `ack` | action ID, assigned revision, resulting document digest | All tabs checkpoint and display the same result |
| `state` | session ID, revision, validated document | Used for join and coordinator recovery |
| `presence` | tab ID, liveness time | Supports coordinator handoff |

Messages carry no AI read capability or image. Duplicate action IDs are ignored. A tab must not present an unacknowledged action as a completed, shareable drawing. If coordination fails, local drawing remains usable; AI reads fail rather than return an uncertain revision.

## MCP tool

**Tool:** `read_current_drawing` (replaces the selected-region tool).

**Input:** Empty object. Calling the tool is the request to inspect the current drawing; opening or pausing on the canvas does not send an image.

**Success:** One metadata text item and one PNG image item. Metadata includes `snapshotId`, `capturedAt`, `drawingRevision`, and context stating that the image is a drawing, not verified implementation. The PNG frames every committed stroke with padding at that revision while keeping the standard pen line at least 1.5 output pixels thick. Navigation and the toolbar are excluded.

**Failure codes:**

| Code | Meaning | User action |
| --- | --- | --- |
| `NO_DRAWING` | No committed strokes | Draw something and retry |
| `AMBIGUOUS_CANVAS` | More than one distinct active drawing | Leave only the intended drawing available, then retry |
| `SESSION_UNAVAILABLE` | No authorized live session or connection | Open/reopen the canvas and retry |
| `CAPTURE_TIMEOUT` | Gesture or capture did not finish in time | Finish the gesture and retry |
| `CAPTURE_UNREADABLE` | Whole drawing cannot fit legibly in one allowed image | Bring distant marks closer or revise the sketch, then retry |
| `PAYLOAD_TOO_LARGE` | Encoded image exceeds the accepted size | Reduce drawing complexity and retry |
| `BUSY` | Another read is in progress | Retry after it finishes |

All errors are text results, never stale image fallbacks. The broker validates image dimensions, PNG structure, generation, revision, and deadline before delivery. It discards image bytes after response completion. MCP exposes no write tool.

## Isolation and lifecycle

- One active session shared by duplicated tabs is one candidate for the helper. Distinct sessions are never merged or silently selected by recency.
- A read requested while a stroke is active waits for that gesture to commit or cancel within the request deadline. It then freezes one acknowledged revision.
- A later edit cannot mutate an earlier delivered snapshot.
- An expired or ended session cannot satisfy an in-flight or later read, even if a tab sends a late image.
- Broker restart, tab closure, or helper failure does not erase strokes in an open browser tab. Browser drawing remains usable while the AI connection is unavailable.
