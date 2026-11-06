# Data Model: Canvas-First Open Workspace

All drawing records are transient. No application database or durable image store is added.

## Canvas Session

| Field | Meaning | Rules |
| --- | --- | --- |
| `sessionId` | Opaque identity shared by duplicated tabs | Generated once; never used alone as an authorization secret |
| `generation` | Broker incarnation for revocation | Changes on broker/session restart; old read grants fail |
| `ownerCapability` | Browser-to-broker authority | Session-scoped; retained only in tab session storage and memory |
| `state` | `active`, `expired`, or `ended` | Reads allowed only while active |
| `leaseExpiresAt` | Broker expiry | Refreshed by a live tab; expiry revokes read access |
| `tabs` | Active tab leases | Each tab has an ephemeral runtime ID; closing one does not end other tabs |
| `documentRevision` | Latest acknowledged drawing action | Monotonically increasing within the session |

One Canvas Session has one Drawing Document, zero or more live Tab Presences, and at most one pending AI read. Duplicated tabs refer to the same session. A distinct canvas session must not be guessed when multiple are available.

**Transitions:** `active → expired` on lease expiry or `active → ended` when the final tab ends cleanly. A confirmed reload of an open tab rejoins the same active drawing; a duplicated tab may join through a live sibling. Restoring a closed final tab starts a blank new session even if the browser retained its old checkpoint. Checkpoint presence by itself is never proof that the old session is live. After a broker restart, a confirmed continuous tab may establish a new broker generation for its existing local drawing; old read grants never revive.

## Drawing Document

| Field | Meaning | Rules |
| --- | --- | --- |
| `strokes` | Ordered committed Stroke records | World-coordinate positions; visible older strokes remain after history eviction; existing 1,000-stroke safety cap rejects an additional stroke without altering earlier work |
| `undo` | Undoable action IDs | At most 50 newest committed drawing actions |
| `redo` | Undone action IDs | At most 50; cleared by a new committed stroke |
| `revision` | Content revision | Changes on commit, Undo, and Redo; never on pan or zoom |
| `checkpointVersion` | Recovery schema | Invalid versions fail safely without interpreting stale data |

The document is the one shared drawing across duplicated tabs. Its latest acknowledged revision is the only eligible source for an AI snapshot. An action must be durably checkpointable for the tab session before it is acknowledged as committed; storage failure preserves the prior document and reports that the new stroke was not saved. Hitting the drawing cap also preserves the prior document, with a distinct drawing-limit notice.

## Stroke and Drawing Action

| Entity | Fields | Validation |
| --- | --- | --- |
| Stroke | `id`, ordered `points`, drawing attributes | Unique ID; at least one finite world point; bounded per-stroke point count |
| Point | `x`, `y` | Finite world coordinates; no fixed-page clamp |
| Drawing Action | `actionId`, `sessionId`, `revision`, `kind`, `strokeId` | Unique and idempotent; ordered by the session coordinator; kinds are commit, undo, redo |

One completed stroke is one Undo step. A cancelled gesture is not a Stroke or Drawing Action. Two tabs send actions to one coordinator; acknowledgements and revisions prevent duplicate replay. On coordinator loss, a survivor with the newest acknowledged checkpoint becomes coordinator before new shared actions are accepted.

## Viewport and Gesture

| Entity | Fields | Rules |
| --- | --- | --- |
| Viewport | `offsetX`, `offsetY`, `scale` | Per-tab, not in drawing history; finite values and bounded zoom |
| Gesture | active pointer IDs, tool, start positions, provisional points | Per-tab and never checkpointed or shared until committed |

The viewport transforms world points into screen pixels. A second touch during a provisional pen stroke cancels that provisional stroke before pan or pinch begins. Wheel, pinch, hand drag, and Space drag change only the viewport.

## AI Read Access and Snapshot

| Entity | Fields | Rules |
| --- | --- | --- |
| AI Read Access | broker generation, read capability hash, active session | Broker-held and read-only; no browser-delivered read token or canvas-write method |
| Capture Request | request ID, session generation, deadline, expected revision | One pending request per session; only current generation may complete it |
| Whole-Drawing Snapshot | snapshot ID, capture time, drawing revision, PNG bytes, dimensions | Frozen from all committed strokes at one revision; immutable after delivery |

The image is not a durable entity. It exists only for the request and response lifetime. Empty, ambiguous, expired, unreadable, and oversized cases return typed failures; no older snapshot substitutes for a failed read.

## Invariants

1. Drawing revision and visible stroke order match across healthy duplicated tabs after each acknowledged action.
2. Undo and Redo never change viewport coordinates.
3. The 51st undoable action evicts the oldest Undo entry, not its visible stroke.
4. No AI read operation can add, remove, or modify a Stroke.
5. A snapshot includes all committed strokes at its recorded revision or is not delivered.
6. Ending the last tab or expiring the broker generation revokes future reads; an image already delivered is outside this revocation boundary. A restored closed final tab cannot revive the ended drawing.
