# Feature Specification: Canvas-First Open Workspace

**Feature Branch**: `002-canvas-first-workspace`

**Created**: 2026-11-05

**Status**: Draft — ready for planning

**Input**: Open interactive directly on an open-ended drawing canvas. Keep the existing cream, green, and serif visual direction, simplify controls to a bottom-centered icon toolbar on desktop and mobile, and let ChatGPT read the latest whole drawing when asked without selection or a manual Connect action.

## Clarifications

### Session 2026-11-05

- Q: If you reload the canvas page, should your drawing return in the same tab? → A: Yes. Restore it during the same tab session, then clear it when that session ends.
- Q: After you duplicate a canvas tab, should a stroke drawn in either tab appear in the other right away? → A: Yes. Both tabs stay in sync as one drawing.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start Drawing Immediately (Priority: P1)

As a designer or architect, I open interactive and begin sketching without a landing screen or a fixed page boundary.

**Why this priority**: A direct, spacious drawing experience is the main purpose of the redesign.

**Independent Test**: Open the app on desktop and iPhone, draw near the starting view, pan elsewhere, draw again, and return to the first marks.

**Acceptance Scenarios**:

1. **Given** a fresh visit, **When** I open interactive, **Then** the canvas is ready for drawing without a welcome screen or Start button.
2. **Given** the pen tool is active, **When** I drag with a mouse or one finger, **Then** a visible freehand stroke follows my input.
3. **Given** I pan away from the starting view, **When** I draw and later return, **Then** all strokes retain their relative positions without being clipped by a page edge.
4. **Given** existing strokes, **When** I pan or zoom, **Then** only the view changes; the strokes and drawing history remain unchanged.
5. **Given** an open drawing, **When** I reload its page in the same tab, **Then** its committed strokes and drawing history return so I can continue; ending the tab session clears the drawing.
6. **Given** I duplicate an open canvas tab, **When** I draw or use Undo or Redo in either tab, **Then** both tabs show the same current drawing and history without a manual sync action.

---

### User Story 2 - Navigate Without Accidental Ink (Priority: P1)

As a canvas user, I move and zoom around a large drawing with familiar desktop and touch gestures without accidentally drawing.

**Why this priority**: An open-ended canvas is useful only if people can find and revisit their work reliably.

**Independent Test**: Draw across several views, exercise each pan and zoom gesture, and confirm that navigation creates no strokes and Undo affects drawing only.

**Acceptance Scenarios**:

1. **Given** the pen is active on desktop, **When** I turn the mouse wheel or pinch on a trackpad, **Then** I zoom around the pointer or gesture location. **When** I hold Space and drag, **Then** I pan without drawing.
2. **Given** the hand tool is active on desktop, **When** I drag, **Then** I pan without drawing.
3. **Given** the pen is active on iPhone or iPad, **When** I drag with one finger, **Then** I draw; **when** I drag with two fingers, **then** I pan; **when** I pinch, **then** I zoom.
4. **Given** the hand tool is active on touch, **When** I drag with one finger, **Then** I pan without drawing; a pinch still zooms.
5. **Given** a second finger joins a drawing gesture, **When** the gesture becomes a pan or pinch, **Then** no stray or partial stroke is committed.
6. **Given** committed strokes, **When** I use Undo or Redo, **Then** drawing history changes while the current view position and zoom remain in place.

---

### User Story 3 - Ask ChatGPT About the Latest Drawing (Priority: P1)

As a designer or architect, I ask ChatGPT to inspect my current drawing without selecting a region, exporting an image, or pressing an in-app Discuss or Connect button.

**Why this priority**: Conversation belongs in ChatGPT; interactive should remain focused on drawing.

**Independent Test**: Open a canvas, sketch and revise a rough flow, ask ChatGPT to inspect it, and confirm the returned image contains the latest committed marks from that canvas.

**Acceptance Scenarios**:

1. **Given** an open canvas and a configured local ChatGPT connection, **When** I ask ChatGPT to inspect it, **Then** the current canvas can be read without a manual pairing action in the app.
2. **Given** a stroke is in progress when a read begins, **When** it finishes, **Then** the read captures one consistent current drawing.
3. **Given** committed strokes occupy an area of the open canvas, **When** ChatGPT reads, **Then** one image frames all those strokes with padding and preserves their relative layout.
4. **Given** a completed read, **When** I edit and ChatGPT reads again, **Then** the next image reflects the edits while the earlier image remains unchanged.
5. **Given** no committed ink, **When** ChatGPT requests a read, **Then** it receives a clear no-drawing result rather than a blank or stale image.
6. **Given** the AI connection is unavailable, **When** I continue drawing, **Then** the canvas remains usable and a read fails clearly without changing my work.
7. **Given** two duplicated tabs showing one drawing, **When** ChatGPT reads it, **Then** it receives the shared drawing's latest committed strokes as one snapshot.

---

### User Story 4 - Use a Minimal, Consistent Toolbar (Priority: P2)

As a desktop or touch user, I find essential drawing actions in the same place without persistent explanatory text covering the canvas.

**Why this priority**: The current controls compete with the drawing and vary by screen size.

**Independent Test**: Compare desktop and phone views, identify the same four icon controls, and use each with pointer, keyboard, and touch input.

**Acceptance Scenarios**:

1. **Given** the canvas is open, **When** I look for tools on desktop or mobile, **Then** a compact toolbar is centered along the bottom with pen, hand, Undo, and Redo in the same order.
2. **Given** I use a pointer or keyboard, **When** I hover over or focus an icon, **Then** its action name appears; the pen is named “Draw.”
3. **Given** I use a screen reader, **When** I focus an icon, **Then** its action and selected state are announced.
4. **Given** I use touch without hover, **When** I need a tool name, **Then** an equivalent discoverable label is available without permanent button text.
5. **Given** the normal drawing view, **When** I inspect the screen, **Then** no landing page, in-app chat panel, Discuss button, or persistent AI-sharing sentence occupies the workspace.

### Edge Cases

- If a second finger lands during a stroke, the gesture transition must not leave accidental ink or corrupt Undo.
- If a stroke lies far from the others, a whole-drawing read must not silently omit it. If a useful image cannot be produced, return an actionable failure rather than a misleading partial image.
- If the drawing is empty or only an unfinished stroke exists, do not return an earlier snapshot as current.
- Duplicated tabs of one drawing are one AI-read target; if distinct drawings are open and the target is ambiguous, fail the read clearly rather than guessing which drawing to expose.
- If the connection drops or the last tab in a canvas session closes during a read, do not reuse a revoked permission or stale image.
- Undo, closing the tab, and ending a session cannot retract an image already delivered to ChatGPT.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST open directly to an open-ended freehand canvas branded “interactive,” without a landing-screen action.
- **FR-002**: Users MUST be able to draw beyond the starting view in any direction and return to earlier strokes without clipping or changing them.
- **FR-003**: The pen MUST use mouse drag on desktop and one-finger drag on touch to draw. The hand MUST use mouse or one-finger drag to pan without drawing.
- **FR-004**: With the pen selected, two-finger touch drag MUST pan and pinch MUST zoom; with the hand selected, pinch MUST still zoom. Desktop wheel input MUST zoom around the pointer, and Space plus drag MUST temporarily pan.
- **FR-005**: Pan, zoom, cancelled gestures, and transitions between drawing and navigation MUST NOT commit unintended strokes or change drawing history.
- **FR-006**: Undo and Redo MUST affect committed strokes while preserving the current view position and zoom.
- **FR-007**: Desktop and mobile MUST show the same bottom-centered, icon-only pen, hand, Undo, and Redo toolbar. Controls MUST have accessible names and selected-state information, with action labels available on hover and focus and an equivalent way to discover names on touch.
- **FR-008**: The interface MUST retain the current cream, green, and serif visual direction while prioritizing canvas space. The normal drawing view MUST NOT show a persistent discussion panel, Discuss button, or AI-sharing sentence.
- **FR-009**: Opening an available canvas session MUST make that session readable by the configured ChatGPT integration without a manual Connect action. Read access MUST be scoped to that session and end when it ends or expires.
- **FR-010**: ChatGPT MUST receive an image only when it requests a read during the external conversation. The app MUST NOT automatically send images or trigger AI replies after an idle timer, and MUST NOT add an in-app chat or voice interface.
- **FR-011**: Each successful read MUST wait for an active stroke to finish and capture one immutable image of all committed strokes, framed by their outer bounds with padding and preserving their relative layout.
- **FR-012**: Each read MUST include capture time and a snapshot identity; later edits and reads MUST NOT alter earlier snapshots.
- **FR-013**: Empty drawing, ambiguous canvas targeting, unavailable connection, and failed capture MUST produce distinct, actionable results without substituting stale or partial images.
- **FR-014**: Drawing, navigation, and history MUST remain usable during AI reads and connection outages. AI reads and failures MUST NOT edit the canvas.
- **FR-015**: Drawing data and application-managed image copies MUST remain transient for the canvas session. Reloading a tab in that session MUST restore its committed strokes and drawing history; ending the last tab in that session MUST clear them. A discoverable explanation MUST state that ChatGPT can read the current drawing and that delivered images follow ChatGPT's retention rules, without adding persistent copy to the normal canvas view.
- **FR-016**: Duplicating an open canvas tab MUST show the same drawing in both tabs. Committed strokes, Undo, and Redo in either tab MUST update the other tab without manual synchronization. Closing one tab MUST NOT end the shared canvas session while another tab remains open.

### Key Entities *(include if feature involves data)*

- **Canvas Session**: One transient drawing and its authorized AI-read scope, recoverable after a reload and shared by its duplicated browser tabs until its last tab closes.
- **Stroke**: A committed freehand path with identity, ordered positions, and drawing attributes.
- **Viewport**: The visible position and zoom of the canvas; changing it does not change strokes.
- **Whole-Drawing Snapshot**: An immutable image framing all committed strokes at one revision, with identity and capture time.
- **AI Read Access**: Temporary permission for the configured client to request a snapshot of one canvas session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a five-person walkthrough across desktop and touch devices, at least four people begin drawing within 10 seconds of opening the app without guidance.
- **SC-002**: In the same walkthrough, at least four people draw, pan, zoom, undo, and redo without assistance after seeing the toolbar, and return to an earlier mark after panning away.
- **SC-003**: Across all scripted touch gesture transitions and cancellations, zero unintended strokes are committed and existing strokes remain unchanged.
- **SC-004**: In all scripted AI reads, the image includes every committed stroke from the intended canvas, excludes other canvas sessions, and reflects one consistent revision; empty or ambiguous reads fail clearly.
- **SC-005**: On supported desktop and iPhone test devices with a representative 500-stroke drawing, at least 95% of drawing, panning, and zooming interactions show visible feedback within 100 milliseconds.
- **SC-006**: In at least eight of ten representative sketch discussions, the AI addresses visible content and acknowledges ambiguous marks without claiming the sketch proves an implementation exists.
- **SC-007**: In all scripted connection interruptions, users continue drawing and recover access without losing the open session's strokes.

## Assumptions

- ChatGPT remains the conversation and voice surface; interactive remains a separate drawing app. Opening this AI-focused canvas authorizes the configured local integration to access its current drawing when ChatGPT requests a read.
- The first capture strategy is one image framed by stroke bounds with padding. Edge detection, automatic segmentation, image tiling, and automatic image sending are deferred until real use shows a need.
- A concise explanation of sharing and relevant connection errors can be available without persistent canvas controls or messages.
- The [Figma redesign concept](https://www.figma.com/design/aIalohp0XclbOEWbNv3QYh?node-id=4-2) is the visual reference for this draft; the acceptance criteria above govern implementation.
- The approved Interactive Constitution v3.0.0 permits whole-drawing reads and automatic session-scoped access while retaining read-only AI behavior and transient drawing data.
