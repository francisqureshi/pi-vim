# Status mode-label evidence (2026-10-18)

This is a presentation feature, not a render optimization. The existing replay
harness now accepts an optional `editor|status` placement (default `editor`).
It still covers all 48 fixtures documented in `compact-label-evidence.md`:
20/80/120 columns, short/long Unicode prompts, plain/ANSI paint, and
insert/normal/EX-hit/EX-miss; 100 warmup, seven samples of 100 renders.

## Before and after

Before changing runtime sources, ran:

```sh
node --import tsx/esm script/render-label-bench.ts full > /tmp/status-before-full.json
node --import tsx/esm script/render-label-bench.ts compact > /tmp/status-before-compact.json
```

After implementation, ran the same commands to `/tmp/status-after-full.json`
and `/tmp/status-after-compact.json`, plus:

```sh
node --import tsx/esm script/render-label-bench.ts compact status > /tmp/status-after-status.json
```

Environment: Node v24.19.0, linux/x64, AMD Ryzen 7 5800X. The harness's mock
terminal now uses the real API name `columns` instead of unused `cols`; all
render widths remain explicit and identical. The status callback adds label
lengths to the checksum, simulating publication without invoking a real footer.

Below are arithmetic means of the per-fixture median microseconds/render,
16 fixtures per width. These aggregates are not latency percentiles.

| Width | Before full | After full | Before compact | After compact | Status compact |
| --- | ---: | ---: | ---: | ---: | ---: |
| 20 | 124.17 | 126.41 | 121.87 | 122.56 | 125.41 |
| 80 | 148.86 | 152.35 | 153.87 | 152.73 | 119.33 |
| 120 | 168.76 | 165.91 | 167.60 | 177.17 | 118.48 |

All-fixture means: full 147.26 → 148.22 µs; compact 147.78 → 150.82 µs.
The 120-column compact increase is visible, not proof of equivalence.
ANSI EX-miss variability remains substantial (120-column short compact:
271.97 → 381.77 µs; full: 352.73 → 228.27 µs). Stable 80-column long
plain compact frames: insert 217.41 → 226.01, normal 229.62 → 229.37,
EX hit 230.28 → 219.78 µs. No cache/truncation optimization is justified by
these noisy shared-machine observations.

Default-path output checksums match exactly before/after: full 14856000,
compact 15624000. Status checksum is 17094168 and is not comparable because
it includes callback labels and unmodified borders. Raw per-fixture samples
are retained at the paths above. Status avoids border truncation, but this
benchmark does **not** measure Powerline rendering, terminal latency, idle
invocation rates, or callback work during input (input replay remains outside
the timed region). No end-to-end speedup is claimed. Manual responsiveness,
theme switching and wrapper integration remain QA checks.

## Packaging

Fresh `pack:check` measured 60418 B packed / 237879 B unpacked, 17 files,
versus prior budgets 59500 / 233500. The budget moves to 61000 / 240000 to
cover the setting, status lifecycle/callback machinery, and user documentation.
There are no new runtime dependencies or shipped test/benchmark files.
`pack:check` then passed against the new budgets. Scoreboard regeneration is
required by both this harness extension and the budget change.

## Scope and review

Status placement is a Pi UI integration, explicitly not an nvim editing
feature; no motion/operator semantics or parity cases change. Tests cover
configuration precedence/malformed containers, feedback, bounded width,
deduplicated publication, theme repaint, submit, factory initialization,
session replacement, shutdown and stale-editor suppression. The default
editor rendering branch is unchanged. Self-review follows
`doc/review-guidelines.md`; no dependencies, user settings, release metadata,
or Powerline code were modified.
