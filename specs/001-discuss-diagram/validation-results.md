# Acceptance status and baseline

**Date:** 2026-11-05 (America/New_York). **Status:** functional automation passes;
CLOSED for this iteration: functional checks pass; physical performance and participant testing explicitly waived.

| Baseline | Observed value |
| --- | --- |
| Mac | MacBook Pro, Mac14,5; Apple M2 Max; 32 GB memory |
| macOS | 26.5.1 (25F80) |
| Installed Chrome | 154.0.8037.99 |
| Installed Safari | 26.5, build 21624.2.5.11.4 |
| Automation | Playwright 1.64.1; Chromium 156.0.8078.4; WebKit 27.2 |
| Phone | Operator confirmed physical iPhone 12 and Safari; exact iOS/Safari builds not reported |
| Device arrangement | Safari drawing on iPhone; local MCP and live voice on Mac |

Serial numbers and hardware identifiers are intentionally excluded. Display scaling, power,
thermal conditions, and external recording apparatus have not been frozen for measurement.

| Criterion | Current result | Evidence / remaining work |
| --- | --- | --- |
| SC-001 first-use | WAIVED | Operator skipped participant testing; no five-person result claimed |
| SC-002 selected context | PASS for scripted functional checks | Exact preview/crop, crossing strokes, blank states, frozen revisions, changed snapshots |
| SC-003 safety/recovery | PASS for scripted functional checks | Capability separation, revocation, restart, expiry, cancellation, no-image failures, retained local ink |
| SC-004 visible latency | WAIVED / not measured | Operator waived external physical measurement; no p95 claim |
| SC-005 improvement | WAIVED | Operator skipped participant comparison; no improvement result claimed |
| SC-006 answer quality | OBSERVED / formal grading WAIVED | Actual image/voice interpretations confirmed; no fixed ten-case pass rate claimed |
| SC-007 voice feasibility | PASS | Actual changed selected images in one live conversation, physical iPhone 12 Safari + Mac voice; see feasibility.md |

The 500×1,000 deterministic workload is implemented in tests/fixtures/workloads.ts; the ten
reviewer-only case descriptions are in tests/fixtures/visual-cases.ts. Creating them is not
evidence of measured speed or grading. Installed Safari and Chrome versions were read from
their app manifests, and native Safari/Chrome drawing/history/selection/actual-MCP/status plus surviving-tab restart/re-pair were checked directly. Physical phone observations are in test-evidence.md. Exact phone build and formal measurement settings remain incomplete.
WebKit automation does not replace physical Safari acceptance. Routine checks are now
on-demand by explicit user request and do not require repeating the operator walkthrough.

## Acceptance scope decision — 2026-11-05

The operator explicitly waived participant testing and then physical latency measurements
for this first spec. SC-001, SC-004, SC-005 and the formal target-user grading portion of
SC-006 are waived for this iteration, not passed. No five-user results, measured p95, or
ten-answer grade is claimed. The completed functional checks and observed live voice
results remain valid. These waivers close the remaining acceptance gates for this spec;
future releases may reinstate the retained protocols.
