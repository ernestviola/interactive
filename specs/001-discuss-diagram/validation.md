# Validation Baseline and Acceptance Rubrics

Written acceptance protocol only. No measurements, pilot, or live voice test have run.
This guide clarifies SC-001 and SC-004–SC-006; SC-007 remains in feasibility.md.

## Supported targets and baseline record

| Target | Input | Required acceptance environment |
| --- | --- | --- |
| macOS Chromium | Mouse or trackpad | Physical Mac; stable Chromium build recorded before run |
| macOS Safari | Mouse or trackpad | Same Mac; installed stable Safari build recorded before run |
| iPhone 12 Safari | Finger | Physical iPhone 12; installed iOS/Safari versions recorded before run |

Before tests, record Mac model/chip/RAM, macOS and iOS builds, browser versions, viewport,
display scaling/refresh rate, input device, power settings, app revision, and recording method.
Freeze these baselines across compared runs. Device identity is a test record, not an invented
hardware assumption. Emulated WebKit does not replace physical Safari or the iPhone.

Use the same fixed 1024 × 768 logical drawing on all targets. Keep the app foreground, disable
low-power modes, close unrelated heavy workloads, and record thermal state. Do not claim
results from an unknown device apply to every Mac or iPhone configuration.

## SC-004: Visible-presentation latency

1. Populate a deterministic fixture with 500 strokes of exactly 1,000 points, then warm up
   for 30 seconds. Fixture strokes and selection are identical between target runs.
2. Capture physical input and display together with an external camera at 240 fps or faster.
   Record actual frame rate and visibility limitations. Use only synthetic non-sensitive ink;
   pairing controls/secrets must not be in the recording. Recordings contain no app snapshot
   payloads and are deleted after timing extraction, retaining only timing metadata.
3. For drawing, measure physical mouse/trackpad gesture onset or finger contact to first
   corresponding visible ink. For selection, measure input onset to visible changed selection
   boundary. This conservative metric includes input-device delay. Record both onset and
   presentation frame intervals; use earliest plausible onset and latest plausible visible
   frame, so uncertainty never makes a slow sample appear faster.
4. Collect three runs per target, each containing 100 drawing samples and 100 selection
   samples after warm-up. Undo the small added sample stroke between measurements, retaining
   the fixed workload. Keep selection mode/mouse/finger conditions recorded. Do not pool
   browsers, devices, drawing, or selection results.
5. Compute each series' nearest-rank p95: sorted observation 95 of 100. Every run and each
   interaction type must meet 100 ms at the conservative upper bound. Record all samples,
   count, p95, dropped/unreadable frames, and exclusions. Replace unreadable samples and report
   their count; do not silently remove slow observations.
6. If timing cannot be measured with sufficient visual clarity, mark the result inconclusive,
   not passed. A browser event-to-canvas-update or animation-frame interval is diagnostic only;
   it does not prove visible presentation and cannot substitute for the acceptance metric.

No camera or timing apparatus is presumed to be present now; this is a future validation
prerequisite, not a reason to invent a pass or begin implementation during planning.

## SC-001: First-use workflow

Five representative participants must include both personas, at least two using desktop input
and two using iPhone 12; the fifth may use either. Chromium and Safari must both occur among
desktop sessions. Complete connection setup first; allow no product training beyond the
visible controls and instructions. Start timing when the empty drawing is available and the
task is presented. Stop when the participant has drawn three steps, selected them, received
a grounded spoken answer, and made a manual revision. Record assistance and incomplete runs.
A first-attempt success is completion within five minutes without help; at least four pass.

## SC-005: Paired-task comparison

Use two matched three-step tasks per persona. Each fixture has three labeled freehand boxes,
two directed arrows, one explicitly marked failure or exception, and one decision to make.
Different labels prevent memorized answers while object counts and requested analysis match.

| Persona | Task A | Task B | Defined decision |
| --- | --- | --- | --- |
| Designer | Sign-up → verify email → profile; invalid email marked beside verification | Checkout → pay → receipt; declined payment marked beside pay | Choose where a visible exception returns the user and sketch that route |
| Architect | Client → API → database; timeout marked beside API | Producer → queue → worker; retry marked beside worker | Choose where a failed attempt is handled and sketch that route |

Task text asks for one proposed exception path with a rationale; it does not claim only one
architecture is valid. Before the pilot, freeze written fixture descriptions, task text, and
acceptable decision criteria: the path connects the marked exception to an explicit handling
step and the participant gives a reason without claiming a built system was inspected.

Assign one task to this app and the other to the separate whiteboard/manual screenshot
workflow. Use the same AI client/model, device, input, and task limits for both. For five
participants, three start with the app and two with the comparison; rotate task A/B assignment
so app-first does not always mean task A. Record assignment before the first session.

Allow at most ten minutes per task. Start with task presentation and a ready empty canvas,
after connection/account setup; include drawing, sharing, AI wait, and decision time.
Stop when the participant states a specific justified exception-path decision and draws it.
The facilitator records the decision/rationale and elapsed time. A reviewer checks the fixed
criteria. An incomplete app attempt counts as no improvement. If only the comparison is
incomplete and the app finishes correctly within ten minutes, count improvement. If both
finish, only a strictly shorter app time counts; ties do not. At least four of five must
improve. Record both times, completion, assistance, and criteria judgments.

## SC-006: Fixed visual-answer review

Before requesting answers, prepare ten synthetic freehand fixtures from these descriptions
and freeze their task text and expected facts. Asset creation is future validation work;
these are fixture requirements, not generated assets or test implementation.

| ID | Visible selected content | Question | Required visual facts / ambiguity |
| --- | --- | --- | --- |
| V01 | A → B → C, clearly labeled | Describe this flow | Three nodes in that direction |
| V02 | A → B and A → C | Compare the branches | Two outgoing branches from A |
| V03 | A → B; timeout written beside B | Suggest failure handling | Timeout is a note; any new handler is a proposal |
| V04 | Login → profile; no return arrow | What could be missing? | No drawn return path; suggested recovery is inferred |
| V05 | Client → API → DB; DB crossed out | Discuss a failure risk | Database is visibly crossed out; meaning is uncertain |
| V06 | Two separate unconnected boxes A and B | Explain the relationship | No visible connector; do not invent one as fact |
| V07 | Box labeled “pay?” with a fuzzy final letter | What does this step mean? | Label ambiguity must be acknowledged |
| V08 | A ↔ B as two opposing arrows | Explain directionality | Both directions are visibly present |
| V09 | A → B within selection; unrelated C entirely outside | What is shared? | Only A and B may inform the answer |
| V10 | Retry loop around a worker; no numeric limit | Is retry bounded? | Loop exists; no limit is specified in the image |

For each answer, grade four binary criteria: addresses the requested selected content;
contains no contradiction of expected visible facts or invented off-selection facts;
acknowledges ambiguity where the fixture lists it and distinguishes added proposals from
observations; makes no claim the drawing verifies an implemented system. All four are
required for a pass. Exact wording is not scored. At least eight of ten answers must pass.

Use a designated target-user reviewer and a second target-user reviewer for disagreements.
Freeze fixture facts before grading. If disagreement cannot be resolved from those facts,
mark the case unresolved/nonpassing until resolved; never assume a pass to reach eight.
Record fixture version, question, response, per-criterion judgment, rationale, and final grade
without runtime image payloads, credentials, or private user drawings in logs.
