# Data Model: Discuss a Freehand Sketch

Design only; no schema migration, persistence, or implementation is included.

## Sketch session

- `id`: opaque random identity, never an authorization credential.
- `generation`: random value renewed after expiration/reconnection; rejects stale responses.
- `state`: active, expired, or ended.
- `pairingEpoch`: integer incremented on pairing rotation/revocation.
- `ownerCapabilityHash`, `readCapabilityHash`: separate hashes of random 256-bit capabilities.
- `leaseExpiresAt`: server time; renewed by authenticated browser heartbeat every 5 seconds.
- `lastRead`: snapshot ID, capture time, revision, and sent-to-client status only; no image.
- `pendingCapture`: at most one pending request identity.

The local broker owns this record. A read requires an active lease and matching read capability.
An owner can manage only its own session. A read capability cannot invoke management routes.
Session end atomically revokes both capabilities and cancels pending captures. Commit lastRead only after a successful response flush, never on browser upload acceptance.
The indicator means sent to the MCP client, not confirmed receipt, model understanding, or
spoken response. Ended sessions must not be recreated by a late flush callback.

Unexpected tab closure has no reliable immediate signal: use best-effort end plus a 20-second
lease bound. Browser backgrounding can expire the lease. Reconnection creates fresh pairing,
never revives old capabilities. Retain local strokes if the same tab remains open.

## Stroke and drawing state

Browser-tab memory only:

- Stroke: `id`, ordered logical canvas points `{x,y}`, constant width and color.
- Drawing: completed strokes, redo stack, revision, and optional current pointer gesture.
- Revision: monotonic integer, incremented on committed stroke, undo, or redo.
- Initial drawing extent: fixed 1024 × 768 logical units; scale to available viewport.
- Initial brush: one dark pen on white background; no colors, pressure, eraser, or zoom required.

Undo removes one committed stroke; redo restores it. New ink clears redo history.
Pointer cancellation discards only the unfinished gesture. Resize/orientation re-renders
logical coordinates without changing stroke data. Controls remain outside the drawing region.
Performance acceptance uses 500 strokes of up to 1,000 points each; this is a workload,
not the content limit. Hard capacity: 1,000 strokes including redo history, 2,000 points
per stroke, and 1,000,000 stored points across active/redo history. Shared references count
once. Redo stays within the same capacity. A new stroke clears redo only after that stroke
is accepted. Undo alone retains points in redo and may not free capacity.

Reject an over-limit new stroke as a whole; preserve existing committed ink, selection,
and undo/redo history. At a point limit, stop the transient preview visibly and explain that
the attempted stroke was not saved; never silently discard trailing points while showing
success. A shorter stroke can recover from a per-stroke limit. Add an owner-only “Discard
redo history” control to free undone content; starting a new session requires an explicit
session-loss warning. No AI mutation capability is introduced.

## Selection region

Browser-tab memory: `x`, `y`, `width`, `height`, and monotonic `selectionRevision` in logical
canvas units. Normalize reverse drags, clamp to drawing bounds, and reject zero area.
One rectangle at a time; Draw and Select are explicit modes on desktop and phone.
Replacing/clearing a selection changes its revision without changing drawing revision.

An exact preview uses the same renderer and clipping as capture. Rendered selection outlines,
buttons, credentials, and pointer cursors are excluded. A crossing stroke is clipped to the
rectangle. Ink emptiness is determined from rendered pixels against the white background.

## Capture request

Broker record: `requestId`, `sessionId`, `generation`, `pairingEpoch`, `createdAt`, `deadline`, status,
and optional final metadata. Deadline is 10 seconds from read initiation.

States: queued → delivered-to-browser → encoding → fulfilled; any pending state may become
failed, timed-out, cancelled, or revoked. The server accepts one terminal result only. A late/duplicate
post cannot fulfill a newer read. A parallel read receives BUSY, with no queued screenshot. Bind every request to the admitting
pairing epoch; recheck that epoch and lease immediately before response serialization.
MCP cancellation/disconnection cancels the request and rejects later browser results.

The browser waits for active draw/select gestures to finish within the same deadline before
freezing state; otherwise capture fails. It freezes completed strokes, selection, and both
revisions synchronously into a detached canvas before asynchronous PNG encoding. Browser
editing can continue immediately after that freeze. No selection is always an error, never
a request to capture the whole drawing.

## Sketch snapshot

Transient fields: `snapshotId`, drawing revision, selection revision, capture time,
`image/png` bytes, and pixel width/height. PNG uses the selected region at one pixel per
logical unit; output width/height are the ceilings of selected width/height and the source
rectangle is mapped to those dimensions without including neighboring source pixels. Maximum
image dimensions are 1024 × 768; maximum encoded payload is 4 MiB. Oversize data fails clearly.
The preview follows this exact pixel rule, including white background and edge clipping.

Only snapshot ID, capture time, and revisions travel as text metadata. The selected image
contains the visual context; full strokes, off-selection bounds, surrounding marks, session
credentials, and conversation history are not returned to AI.

Image buffers are released on response completion/error/timeout. No file, database, browser
storage, latest-image cache, or image-body log is created. MCP/client/ChatGPT copies already
sent cannot be deleted by the app. Retained last-read metadata is deleted with the session.
Runtime garbage collection cannot guarantee immediate physical memory erasure.

## Pairing

An explicit owner action generates a read capability and makes it available for copying into
the desktop host's local environment/configuration, outside chat. Its raw value is shown only
in a connection-control area, never in the drawing or preview, and not persisted by the app.
The browser keeps its owner capability in tab memory. A new read capability revokes the old
one; ending/restarting/expiring the session requires pairing again. No session enumeration
is exposed to MCP.

Local-operator refinement after the user's no-export request: one volatile native-client
handoff slot may hold the currently owner-issued read capability, alongside its session and
pairing epoch, so the configured desktop authentication helper can obtain it. This slot is
separate from the hash-only session registry, never persisted, and cleared on revocation,
expiry, or restart. Its loopback endpoint requires a separate local operator bootstrap
credential and cannot select, enumerate, or manage sessions. See local-session.md.
