# Research: Canvas-First Open Workspace

## Existing system and platform

**Decision:** Extend the existing Next.js client, in-memory local broker, and read-only MCP integration. Keep the current local hosting arrangement for this feature; provision no new GCP service.

**Rationale:** The application already has stroke history, browser capture, session leases, a loopback broker, an authenticated local helper, and controlled contract/browser tests. The earlier [hosting decision](../001-discuss-diagram/planning-inputs.md) explicitly deferred GCP deployment while retaining GCP as the intended cloud platform. Replacing the stack would add work without addressing a demonstrated gap.

**Alternatives considered:** A new hosted drawing service or third-party canvas SDK. Both would expand the access and deployment boundary before this flow has been validated.

## Open canvas and input

**Decision:** Store committed stroke points in unbounded world coordinates. Give each tab its own viewport transform. Convert pointer positions into world coordinates, and render only the visible area at device pixel ratio. Use one gesture state machine for pen, temporary Space hand, hand tool, touch pan, and pinch; cancel an unfinished stroke when a second touch begins. Zoom about the cursor or pinch midpoint.

**Rationale:** The current drawing state clamps points to a fixed 1024×768 rectangle. Separating content from viewport removes that boundary and keeps Undo independent of navigation. The [Pointer Events guidance](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) and [touch-action guidance](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action) describe cancellation when the browser takes over a gesture; the drawing surface must own its intended touch gestures and handle `pointercancel`. Trackpad pinch can arrive as a wheel event with the control modifier, per [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/ctrlKey).

**Alternatives considered:** A very large fixed bitmap or a scrollable page. Both impose an arbitrary boundary and make viewport zoom harder to separate from drawing coordinates.

## Session recovery and duplicated tabs

**Decision:** Keep a validated drawing/history checkpoint and session identity in tab-scoped `sessionStorage`. A duplicated browser tab joins the same canvas session, obtains the latest state from its sibling, and exchanges ordered drawing actions over `BroadcastChannel`. Use a single session coordinator elected with Web Locks to serialize actions, including Undo and Redo; every action has a unique ID and revision so replay and failover are idempotent. Each tab may keep its own viewport. The candidate continuity rule recovers a valid checkpoint only when the browser reports a reload navigation or a live sibling supplies the current drawing; a restored closed final tab starts blank. Probe that rule on the supported browsers before product implementation. The broker's in-memory lease expires if final-close signaling is missed.

**Rationale:** [Session storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage) survives reloads and may initially be copied into a newly opened related tab, but copies do not stay synchronized; browsers may also restore it with a closed tab. [Navigation Timing](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/type) reports an explicit `reload` type, but its behavior during tab restoration must be measured rather than presumed. [BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) provides same-origin messages; [Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) coordinates a single writer across tabs. The browser may skip close events, especially on mobile, so revocation cannot depend only on `pagehide` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event)). A lease is the backstop for read access, while recovery must independently establish reload or live-sibling continuity before using a checkpoint.

**Alternatives considered:** `localStorage` or IndexedDB as a shared drawing database, which can outlive the last tab; broker-only drawing storage, which would make drawing and reload recovery depend on the broker; independent tab copies, which contradicts the clarified spec.

**Risk to validate:** Browser duplicate, reload, and closed-tab restore behavior vary by browser. Before product implementation, record the reported navigation type, checkpoint presence, and live-sibling response for each path on real desktop browsers and physical iPhone Safari. If a supported browser reports a closed-tab restore as a reload or cannot provide another reliable continuity signal, stop and revise the design before implementation. Expired broker access must never revive an old read capability.

**Capacity rule:** Browser session storage quotas vary, so compact and validate checkpoints. Do not acknowledge a new stroke until its updated checkpoint can be written. If storage rejects it, keep the previous drawing and tell the user the new stroke was not saved; test this against the 500-stroke representative workload.

## History depth

**Decision:** Retain a maximum of 50 undoable committed drawing actions in the canvas session. Each completed stroke is one step; navigation and cancelled gestures are not. Undo/Redo operate on the shared ordered history. A new stroke after Undo clears Redo. Evicting an old undo entry never removes its visible stroke.

**Rationale:** The user chose 50 after comparing published approaches. [Procreate](https://help.procreate.com/articles/tvicQm-undo-and-redo) documents up to 250 steps in an active session, [Procreate Dreams](https://help.procreate.com/articles/dxxgnk-managing-undo-history) defaults to 250 with a configurable range, while [Excalidraw's history implementation](https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/history.ts) does not show a fixed entry cap. The evidence does not establish a universal number. Fifty is a product choice that bounds session memory and still covers several rounds of sketch revision.

**Alternatives considered:** Ten steps, which the user revised upward; 250 or unlimited, which the user declined for this version.

**Capacity note:** The existing drawing state rejects an additional stroke at 1,000 stored strokes and preserves earlier work. Keep that cap for this feature, distinguish its drawing-limit notice from checkpoint-storage failure, and do not treat it as a spatial page boundary.

## Automatic, read-only AI access

**Decision:** On opening or recovering a canvas session, register it with the existing local broker and make it available to the authenticated local MCP helper without displaying a Connect control or handing a read token to the page. The helper resolves exactly one active canvas session; duplicated tabs count as one session. If distinct active drawings cannot be disambiguated, return a clear ambiguity error. A tab coordinator handles one capture request against the latest acknowledged drawing revision. The broker and MCP tool remain read-only with respect to drawing actions.

**Rationale:** The current broker already has owner and read capabilities, generation checks, short leases, request deadlines, and immutable delivery validation. Extending those safeguards is smaller than creating a new access channel. On-demand tool calls preserve the user's choice to ask ChatGPT and prevent idle-triggered image sharing.

**Alternatives considered:** Auto-sending after a drawing pause, choosing the last focused unrelated session, and keeping manual pairing. Each conflicts with the approved sharing flow or could expose the wrong drawing.

## Whole-drawing image

**Decision:** At read time, wait for active gestures to settle, freeze one acknowledged drawing revision, compute the union of committed stroke bounds, add padding and stroke-width allowance, and render it to one bounded PNG while preserving aspect ratio. Keep the existing image-size validation and no-persistent-image rule. If the drawing is empty, too spread out to remain legible at the allowed size, or cannot be encoded before the deadline, return a distinct failure instead of a stale or partial image.

The initial legibility floor is a 1.5-output-pixel standard pen line after fitting. This is a measurable safeguard, not a claim that every mark is semantically readable; the discussion outcome check still evaluates interpretation quality.

**Rationale:** This is the smallest capture that covers the open canvas without asking the user to select a region. The current PNG validator and snapshot provenance checks can be adapted; no automatic segmentation is justified yet.

**Alternatives considered:** Viewport screenshot, which can omit distant strokes; edge detection, tiling, or multiple images, which were explicitly deferred.

## Validation and framework guidance

**Decision:** Keep Vitest unit/contract tests and Playwright Chromium/WebKit browser tests, add physical iPhone gesture and session checks, and document the existing spoken-read capability result. Test covered state, capture, access, and recovery behavior with a failing test first. Before writing Next.js code, restore dependencies and read the relevant guides under `node_modules/next/dist/docs/`, as required by `AGENTS.md`; that directory is not present in the current checkout.

**Rationale:** The repository already has a controlled broker fixture and prior physical-device voice evidence in [feasibility.md](../001-discuss-diagram/feasibility.md). The new whole-drawing path still needs an end-to-end spoken-read check before it can be claimed to work in voice mode. No provider should be required for routine tests.

**Alternatives considered:** Browser-only tests or a live provider in every CI run; neither gives fast deterministic coverage of session and capture failures.
