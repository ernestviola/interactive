# interactive

An open-ended, session-only drawing canvas that ChatGPT can read on request through a local, read-only MCP helper. The current feature is described in [spec 002](specs/002-canvas-first-workspace/spec.md), its [implementation tasks](specs/002-canvas-first-workspace/tasks.md), and [test evidence](specs/002-canvas-first-workspace/test-evidence.md).

## Start

Requires pnpm 12.15.0, which selects the pinned Node 24.22.1 runtime:

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

Open [interactive](http://127.0.0.1:3000). The launcher runs Next.js on port 3000 and the memory-only broker on loopback port 3001. A production build uses `pnpm run build` and `pnpm run start`.

The canvas is ready immediately. Draw with a mouse, pen, or one finger. Use the Hand button, Space-drag, or two fingers to pan; use the wheel, trackpad pinch, or touch pinch to zoom around the pointer or gesture. Undo and Redo share the 50 most recent committed strokes across duplicated tabs. Older ink remains visible. A new stroke clears Redo. The drawing has no page edge, but a 1,000-stroke safety limit and a browser-session storage limit can reject a new stroke with a notice while preserving earlier work.

Reloading an open tab restores its drawing and history. A duplicated tab joins the latest shared drawing before accepting input. Closing the last tab ends the session; a new tab starts blank. Native browser-menu Restore Closed Tab remains a separate browser behavior that automated tests cannot prove; see the evidence file for the tested scope.

## Read the drawing from ChatGPT

Opening a canvas automatically makes that one live drawing available to the configured local helper. There is no Connect, selection, export, in-app chat, or automatic image sending. Ask ChatGPT to call `read_current_drawing`. The helper receives one fresh PNG of every committed stroke, framed by the outer stroke bounds with padding. Edits after a read do not change its earlier image. An active stroke must finish before capture. A drawing spread too far to fit legibly returns `CAPTURE_UNREADABLE`; an empty drawing returns `NO_DRAWING`. Multiple unrelated open canvases return `AMBIGUOUS_CANVAS` instead of selecting one silently.

The local helper uses the private, Git-ignored `.env.voice.local` bootstrap credential through the authenticated loopback authorization endpoint. See [the configuration example](experiments/voice-mcp/config.example.toml). Browser pages receive only their own session owner credentials; the helper's read credential stays broker-side. A broker outage does not stop drawing, and access is re-established automatically when the broker returns. Successful reads are immutable images with snapshot ID, capture time, and drawing revision. The MCP tool cannot edit the canvas.

Drawing checkpoints stay in tab-scoped browser storage for reload recovery. The broker keeps only live session records, leases, pending image bytes, and short-lived read grants in memory. Closing the final tab or lease expiry revokes later reads. ChatGPT can read the current drawing when requested. Images already delivered to ChatGPT cannot be retracted and follow ChatGPT's retention settings.

For a phone on the trusted LAN, set the exact private canvas origin in ignored `.env.local` as `SKETCH_TRUSTED_ORIGINS=http://YOUR-MAC-LAN-ADDRESS:3000`, then open that address in Safari. The broker remains loopback-only on the Mac. The physical LAN and voice capability checks are reported separately in the evidence file.

## Verify

```sh
pnpm run test:unit
pnpm run test:contract
pnpm run test:browser
pnpm run typecheck
pnpm run lint
pnpm run build
```

Browser tests use controlled SDK clients and isolated loopback ports 3100/3101. Playwright Chromium and mobile WebKit run without persisted screenshots, traces, videos, image bytes, or credentials. Simulated WebKit does not establish physical iPhone Safari behavior.

The earlier controlled-image voice experiment is separate from the product MCP tool; see [its feasibility record](specs/001-discuss-diagram/feasibility.md).
