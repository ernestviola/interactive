# Discuss a Freehand Sketch

A local, session-only freehand canvas with an exact selection preview and a read-only MCP
connection. The canvas, history, selected-image sharing, provenance, and recovery are implemented.
Both live voice gates passed with physical iPhone 12 Safari and Mac voice. This first spec
is complete under the operator-approved scope: physical latency measurements and participant
testing were explicitly waived, not reported as passed. The exact phone build is unreported. See [the feature spec](specs/001-discuss-diagram/spec.md),
[tasks](specs/001-discuss-diagram/tasks.md), and [test evidence](specs/001-discuss-diagram/test-evidence.md).

## Start the canvas

Requires pnpm 12.15.0; pnpm automatically selects pinned Node 24.22.1. No shell exports:

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

Open [the desktop canvas](http://127.0.0.1:3000). The launcher supervises Next.js on port
3000 and the separate memory-only broker on loopback port 3001. Stop the disposable
experiment before launching, since it uses that same broker port. For the built app:

```sh
pnpm run build
pnpm run start
```

Click **Start drawing**, draw with a mouse or finger, choose **Select**, and drag a rectangle. Use **Clear selection** to stop sharing that region while keeping your drawing and history.
The preview shows exactly the eligible pixels, without the selection outline or surrounding UI.
Click **Connect** to pair this session with the local desktop MCP helper. Ask the AI to inspect
the selected sketch. Pairing another canvas revokes the earlier read key, preserving its ink.

The existing `interactive` MCP entry can use the same authentication helper shown in
[the configuration example](experiments/voice-mcp/config.example.toml). The helper's private
bootstrap configuration is created once in owner-only, Git-ignored `.env.voice.local`.
Per-session sketch read keys are handed to it through an authenticated loopback-only channel
and stay in memory. No copying tokens, shell exports, or desktop restarts are needed for
normal pairing. Do not run the authentication helper manually into a chat or log.

Strokes, selection, and owner keys live in browser-tab memory. Reloading loses the drawing;
ending the session revokes further reads. Images are transient and never saved or logged.
Already-sent images remain subject to the AI client's retention settings. Drawing stays local
and usable when the broker is unavailable. The app contains no microphone or chat panel.

## iPhone on the trusted LAN

Keep desktop voice on the Mac. Set the exact private canvas origin once in ignored
`.env.local`, then start the app normally:

```dotenv
SKETCH_TRUSTED_ORIGINS=http://YOUR-MAC-LAN-ADDRESS:3000
```

Both processes load that local configuration. The UI listens on the LAN; the broker stays
loopback-only. Open the Mac's LAN address in Safari on the physical phone. Connect from that
phone's canvas to pair its selection with desktop voice. No secret is transferred through
chat or persisted on the phone. Firewall/LAN reachability still needs a real-device check.

## On-demand verification

Run the full verification only when requested:

```sh
pnpm run verify
```

It performs a frozen install, unit/contract tests, browser workflows, typecheck, lint, and
production build, stopping on failure. Nothing is added to commit hooks or scheduled.
For a focused change, use the relevant existing command:

| Check | Command |
| --- | --- |
| State/history/clock behavior | `pnpm run test:unit` |
| Authorization/MCP/capture contracts | `pnpm run test:contract` |
| Complete browser workflows | `pnpm run test:browser` |
| One browser regression | `pnpm run test:browser --grep 'lease expiry'` |
| TypeScript / lint | `pnpm run typecheck` / `pnpm run lint` |

Browser tests own isolated loopback ports 3100/3101 and `.next-test`, preserving the regular
app's ports. They start/stop their broker instances automatically and cover Undo/Redo,
crop/preview equality, fresh metadata, blank selection, complete-stroke rejection,
offline editing, controlled-clock lease expiry, actual broker restart, explicit re-pair,
old-key revocation, session end, native touch taps, and accessible controls.


Browser checks use controlled SDK clients, keep PNGs in memory, and disable screenshots,
traces, and videos. WebKit phone emulation supplements, but does not replace, physical
Safari/iPhone acceptance. All current results and remaining gates are in test-evidence.md.

## Controlled-image experiment

The earlier synthetic-image gate passed actual text, changed-image live voice, and
stopped-server checks. It can be rerun independently with `pnpm run experiment:voice` or
`pnpm run experiment:verify`; see [feasibility.md](specs/001-discuss-diagram/feasibility.md).
Its terminal input sets a private test symbol and number; it is not the drawing canvas.
