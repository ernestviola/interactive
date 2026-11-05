# Feature Specification: Discuss a Freehand Sketch

**Feature Branch**: `001-discuss-diagram`

**Created**: 2026-11-05

**Status**: Clarified — external feasibility validation pending

**Input**: Product designers and system architects draw in a separate web app on desktop or iPhone
and speak with AI through ChatGPT. An MCP connection lets the AI read selected sketches.
User-specified delivery constraints are recorded in planning-inputs.md.

## Clarifications

### Session 2026-11-05

- Q: Should the canvas appear inside ChatGPT or in a separate website? → A: A separate
  web app with an MCP connection, where users draw on a touchscreen and speak aloud to AI.
- Q: Should users speak inside the web app or through ChatGPT while drawing in the web app?
  → A: Users draw in the separate web app and speak through ChatGPT (Option B).
- Q: Should drawing mean freehand pen strokes or structured boxes and arrows?
  → A: Freehand sketching with a finger or stylus; AI reads the selected drawing visually
  (Option A). Structured boxes and arrows are deferred.

- Q: Which devices should we support first? → A: Desktop with mouse or trackpad input,
  and iPhone with finger input. iPhone Safari is the initial mobile browser target.
- Q: Should users sign into the web app before connecting ChatGPT to a sketch?
  → A: No app logins for now; host the prototype locally.

- Q: Is using two devices acceptable for the first prototype, drawing on iPhone while
  speaking to ChatGPT on a computer? → A: Yes. Two devices are acceptable; desktop drawing
  can also happen alongside ChatGPT. Simultaneous voice and drawing on one iPhone is deferred.


## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discuss a Freehand Sketch (Priority: P1)

As a designer or architect, I sketch an idea with a mouse or trackpad on desktop, or a finger on iPhone, in a web app, select
part of the drawing, and ask ChatGPT about it aloud so I can find a gap or explore an
alternative without manually uploading screenshots.

**Why this priority**: This is the complete workflow needed to test the product's value.

**Independent Test**: Draw a rough three-step flow, select it, ask ChatGPT aloud what might
be missing, receive a spoken answer grounded in that sketch, and revise the sketch manually.
This test is conditional on the external voice-and-MCP feasibility gate below.

**Acceptance Scenarios**:

1. **Given** an empty canvas on desktop or iPhone, **When** I draw with the supported pointer input,
   **Then** visible freehand strokes follow my input without creating structured diagram objects.
2. **Given** a drawing, **When** I select a rectangular region, **Then** its boundary and the
   exact image available to the connected AI are visible in the web app.
3. **Given** an explicitly paired MCP connection and a selected region, **When** I ask ChatGPT aloud
   to inspect my sketch and it requests the sketch, **Then** it receives an image of that region
   without requiring me to export or upload it manually.
4. **Given** the supplied image, **When** ChatGPT discusses the sketch, **Then** its answer
   addresses visible content, identifies uncertain interpretations, and does not claim that
   a drawn design proves an implementation exists.
5. **Given** a completed discussion, **When** I add or undo strokes, **Then** my drawing changes
   only through my actions; the AI does not edit it.

### User Story 2 - Know What the AI Can See (Priority: P2)

As a designer or architect, I can see which region is shared and when its image was last sent to the AI client so that
I can distinguish the shared snapshot from changes I make afterward.

**Why this priority**: A live canvas must not silently change an already supplied image.

**Independent Test**: Read a selected region through MCP, change the drawing and selection,
and confirm that the earlier result remains an unchanged image with its original identity.

**Acceptance Scenarios**:

1. **Given** a selected region, **When** the AI reads it, **Then** the result contains an immutable
   image, a snapshot identity, and capture time; after a successful send, the web app displays that snapshot identity
   and capture time labeled “Last sent to AI client,” without claiming AI understanding.
2. **Given** a completed read, **When** I change strokes or selection, **Then** the earlier
   result stays unchanged and the next explicit read captures the current selected region.
3. **Given** drawing outside the selected region, **When** a read occurs, **Then** those marks
   are excluded, including portions of strokes extending beyond the boundary.
4. **Given** no selected region or a selected region containing no ink, **When** a read occurs,
   **Then** the AI receives an actionable empty-state result without an unrelated canvas image.

### User Story 3 - Continue Drawing When the Connection Fails (Priority: P2)

As a designer or architect, I can keep drawing if the AI connection is unavailable and retry
inspection later without losing my sketch.

**Why this priority**: The drawing surface must remain useful independently of AI availability.

**Independent Test**: Interrupt the connection, continue drawing, reconnect, and read the
current selection without recreating the drawing.

**Acceptance Scenarios**:

1. **Given** an unavailable MCP connection, **When** I continue drawing or undo a stroke,
   **Then** the canvas remains responsive and preserves session work.
2. **Given** a failed read, **When** the client retries, **Then** it receives a newly identified
   snapshot of the current selection, without modifying the sketch.
3. **Given** an unavailable or expired sketch session, **When** the AI requests an image,
   **Then** the request fails explicitly instead of returning another user's sketch.

### Edge Cases

- No selection: require the user to select a region; never default silently to the full canvas.
- Blank selected area: return a clear no-ink result.
- A stroke crosses the boundary: share only pixels within the selected rectangle.
- Editing during capture: return one internally consistent image, not mixed revisions.
- Changed selection after a read: the previous snapshot remains unchanged; the next read uses
  the current selection. No automatic image stream is required.
- Disconnection or AI refusal: preserve drawing; do not pretend a discussion succeeded.
- Ambiguous handwriting or symbols: AI must be instructed to acknowledge uncertainty.
- Multiple sketch sessions: a connection must not expose a session outside its paired scope.
- Ended session or invalid pairing: return an explicit failure with no sketch image.
- Closing the local canvas cannot retract images already delivered to ChatGPT.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to draw freehand using a mouse or trackpad on desktop
  and a finger on iPhone Safari. Drawing gestures within the drawing surface MUST NOT
  scroll the page; controls outside it MUST remain reachable on a narrow phone screen.
  Handwriting and shapes remain ink; recognition into structured objects is not required.
- **FR-002**: Users MUST be able to undo and redo strokes within the open sketch session.
- **FR-003**: Users MUST be able to select, replace, and clear one rectangular canvas region.
  The selection MUST remain visibly distinct from drawn content.
- **FR-004**: Before an AI read, the web app MUST show the exact image content eligible to be
  shared and explain that the connected AI can request it.
- **FR-005**: An authorized MCP client MUST be able to explicitly read the current selected
  region as an image, with a snapshot identity and capture time.
- **FR-006**: Every successful read MUST capture one consistent drawing revision and selection.
  Its image MUST remain unchanged after later edits or selection changes.
- **FR-007**: Reads MUST include only the selected image and identifying metadata. Content
  outside the selection, earlier snapshots, and conversation history MUST NOT be added silently.
- **FR-008**: Missing selection, blank image, unavailable session, and failed capture MUST
  return distinguishable, actionable results without substituting other canvas content.
- **FR-009**: Drawing, selection, and undo/redo MUST remain available during AI reads or outages.
  Reads, failures, and retries MUST NOT alter the canvas.
- **FR-010**: Each retry MUST read the current selection as a new capture; it MUST NOT imply
  it is the same image returned by an earlier attempt.
- **FR-011**: After a successful send, the web app MUST show the snapshot capture time and
  identity labeled “Last sent to AI client.” Sending an image MUST NOT be presented as proof
  of client receipt, model understanding, or a spoken answer.
- **FR-012**: The integration MUST instruct the AI to treat sketch interpretations as proposals,
  acknowledge unclear marks, and avoid claims of verified implementation from a drawing alone.
- **FR-013**: The web app MUST NOT require its own microphone capture, speech playback, or
  conversation panel. Spoken conversation takes place in ChatGPT.
- **FR-014**: The local prototype MUST NOT require application accounts or login. Any
  connected MCP client MUST be limited to the explicitly paired sketch session. Credentials
  or pairing secrets MUST NOT appear in canvas content or logs, and unrelated sessions
  MUST NOT be accessible. Local hosting MUST NOT be treated as permission to expose all sessions.
- **FR-015**: Before editing, users MUST see that closing or reloading loses session work.
  Canvas strokes and selection MUST remain available throughout the open session.
- **FR-016**: Ending a sketch session MUST revoke its pairing and stop further reads.
  Application-managed image copies MUST be transient and MUST NOT be persistently stored
  or logged. The sharing notice MUST explain that images already sent to ChatGPT remain
  subject to its own conversation and retention settings.

### Key Entities *(include if feature involves data)*

- **Sketch Session**: A single user's open drawing workspace and its authorized connection scope.
- **Stroke**: A freehand path with its identity, ordered points, and visible drawing attributes.
- **Selection Region**: The current rectangular bounds chosen by the user.
- **Sketch Snapshot**: An immutable image of a selected region, its identity, drawing revision,
  and capture time. It represents visual content, not recognized boxes or relationships.
- **MCP Connection**: A client's authorized access to a specific sketch session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least four of five participants, including designers and architects, draw a
  rough three-step flow, select it, discuss it aloud, and manually revise it without assistance
  within five minutes, excluding initial connection setup. At least two participants MUST
  use desktop pointer input and at least two MUST use iPhone finger input.
- **SC-002**: All scripted capture scenarios share exactly the selected visual region, preserve
  snapshot consistency during edits, and exclude marks outside its boundary.
- **SC-003**: All scripted outage, retry, and unauthorized-access scenarios preserve session
  strokes and selection and expose zero unauthorized sketch images.
- **SC-004**: On each supported desktop and iPhone test device with 500 strokes of up to 1,000 points
  each, 95% of drawing and selection interactions show feedback within 100 milliseconds.
  Apply the per-target, per-run visible-presentation protocol in validation.md.
- **SC-005**: In a pilot with five target users and comparable, counterbalanced tasks, at least
  four identify a gap or make a decision faster than with a separate whiteboard and manual
  screenshot sharing. Record the concrete gap or decision and elapsed time using the matched
  tasks, timing boundaries, and incomplete-attempt rules in validation.md.
- **SC-006**: In ten representative sketch discussions, at least eight answers address visible
  selected content, acknowledge ambiguous marks when present, and avoid unsupported claims
  that the sketch describes an implemented system. Use the fixed ten-case fixture descriptions
  and pass/fail rubric in validation.md, with disagreements resolved before a pass is recorded.
- **SC-007**: Before committing to implementation of the spoken workflow, demonstrate one
  end-to-end ChatGPT voice conversation that reads a newly captured selected sketch through
  MCP and gives a relevant spoken answer. If unsupported, return to the user to revise scope;
  do not silently substitute text chat or an in-app voice interface. The iPhone workflow
  may use a separate computer for ChatGPT voice; no same-iPhone voice test is required.

## Assumptions

- The first slice is a separate, single-user web app with one sketch per session. Initial
  support targets macOS with current stable Chromium and Safari using mouse/trackpad input,
  and physical iPhone 12 with Safari using finger input. Tablet and stylus-specific behavior
  are deferred. The prototype is hosted locally with no application accounts or login.
- Desktop acceptance can use ChatGPT alongside the canvas. iPhone drawing is required;
  the initial iPhone workflow MAY use a computer for ChatGPT voice while the iPhone opens
  the locally hosted canvas over a private local connection. Simultaneous ChatGPT voice
  and drawing on one iPhone is outside scope. SC-007 MUST document the tested arrangement.
- ChatGPT provides conversation and voice. Its ability to consume sketch images through MCP
  during voice interaction is an unresolved external dependency subject to SC-007.
- Durable storage, reload recovery, sharing between users, export, structured diagram objects,
  automatic handwriting recognition, and AI canvas edits are outside scope.
- Users select a rectangle explicitly; the AI reads it on demand rather than receiving a
  continuous stream. The selection captures visible pixels rather than inferred semantics.
- Initial hosting is local development, not a public deployment. GCP remains the intended
  future cloud platform; this slice does not require cloud provisioning. A connection from
  ChatGPT to the local MCP server must be verified through a supported connection mechanism.
  No particular tunnel or remote-access capability is assumed.
- No app login does not remove ChatGPT's own account or workspace requirements.
- The prototype has no persistent application storage. Strokes and selection last only
  for the open browser session. App-managed snapshot copies are transient, are not logged
  or saved as files, and are discarded when their read completes or fails. Ending the sketch
  session MUST invalidate its pairing and prevent further reads. Content already supplied
  to ChatGPT is subject to ChatGPT's own conversation and retention settings; closing the
  canvas does not delete it from ChatGPT.
- Initial access is limited to the local operator and devices on a trusted private network.
  Pairing MUST explicitly bind a client to one active sketch; invalid or ended pairings MUST
  fail without images. The precise local connection mechanism is a planning decision.
- A configured MCP connection, a compatible ChatGPT account/workspace, and connectivity are
  required for AI discussion. Canvas drawing does not depend on AI availability.
- Development follows constitution v2.0.0: test-first context capture, immutable snapshots,
  state transitions, recovery, and prevention of unintended canvas changes. Routine checks
  use controlled clients/responses; real voice/image feasibility and quality are evaluated
  separately under SC-006 and SC-007.
- The performance workload is distinct from content capacity: 1,000 committed/redo strokes,
  2,000 points per stroke, and 1,000,000 points across active and redo history are hard limits.
  Over-limit input MUST NOT truncate committed ink or pretend a partial stroke succeeded;
  reject the new stroke as a whole and explain recovery. Existing selection/history survive.
- The macOS/iPhone 12 validation baseline, measurement protocol, matched pilot tasks, and
  response grading rubric are defined in validation.md. Actual Mac hardware and OS/browser
  versions MUST be recorded before testing; none are inferred from the user's OS name.
- User-mandated delivery constraints remain recorded in planning-inputs.md.
