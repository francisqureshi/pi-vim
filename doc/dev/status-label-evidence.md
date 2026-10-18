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

## Flush-left status follow-up (2026-10-18)

Baseline: `a8fa3e0`. Status now fits at `statusWidth + 1` then removes the
leading spacer before applying colors. Editor placement is untouched. A
focused callback regression failed first (`" I " !== "I "`), then passed
with the implementation; it also checks compact `I` remains visible at width
one and repeated rendering is deduplicated. Full/compact Unicode EX and
existing count/color/lifecycle tests cover the same callback seam.

Ran the existing harness before and after, without modifying it:

```sh
node --import tsx/esm script/render-label-bench.ts compact status
node --import tsx/esm script/render-label-bench.ts full
node --import tsx/esm script/render-label-bench.ts compact
```

Raw results: `/tmp/flush-{before,after}-{status,full,compact}.json`.
Same fixture set and environment as above. Arithmetic means of fixture
medians, µs/render:

| Width | Status before/after | Editor full before/after | Editor compact before/after |
| --- | ---: | ---: | ---: |
| 20 | 242.11 / 193.49 | 209.43 / 189.81 | 216.87 / 180.27 |
| 80 | 206.02 / 158.64 | 247.65 / 208.10 | 265.73 / 198.79 |
| 120 | 199.56 / 168.25 | 286.18 / 218.42 | 297.03 / 217.26 |

Unchanged editor paths also became substantially faster in these sequential
runs: machine contention/noise prevents attributing the differences to this
one-line change. No speedup is claimed or optimization added. Editor checksums
remain exactly 14856000 (full) and 15624000 (compact). Status checksum changes
17094168 → 17084436 because published labels lose their leading spacer.

`npm run check` passes lint, typecheck and 951 tests. Fresh `pack:check` passes:
60496 B packed / 238061 B unpacked, 17 files; existing budgets remain unchanged.
No benchmark, parity coverage or budget changed, so the scoreboard was not
regenerated for this follow-up. Terminal/Powerline column-zero checks remain
with the main integration session and the maintainer QA runbook.

## Symmetric mode block follow-up

The user requested one painted inner space before the mode letter to balance
its trailing space. Status publication again fits the original padded label to
`statusWidth`; Powerline outer padding remains zero. This restores the original
status formatting, not editor placement. Tests cover both styles, colored inner
padding, Unicode EX tails, width bounds, counts, deduplication, and cleanup.
The real Pi/Powerline PTY test verifies ` I ` / ` N ` / ` V ` blocks flush with
the left edge, including after resize and reload.

The existing `compact status` render benchmark ran before and after this change
with the same fixtures/environment. Means of per-fixture medians (µs/render):

| Width | Before | After |
| --- | ---: | ---: |
| 20 | 165.72 | 166.42 |
| 80 | 154.69 | 185.48 |
| 120 | 162.26 | 156.39 |

Raw samples: `/tmp/pi-vim-symmetric-{before,after}.json`; checksum
17084436 → 17094168 reflects restored padding. Mixed timings, including a
slower 80-column aggregate, are not evidence of an optimization or performance
equivalence. No optimization is claimed. Lint/typecheck and all 951 tests pass;
package check passes at 60502 B packed / 238096 B unpacked with unchanged
budgets, dependencies, and shipped-file count.

## Scope and review

Status placement is a Pi UI integration, explicitly not an nvim editing
feature; no motion/operator semantics or parity cases change. Tests cover
configuration precedence/malformed containers, feedback, bounded width,
deduplicated publication, theme repaint, submit, factory initialization,
session replacement, shutdown and stale-editor suppression. The default
editor rendering branch is unchanged. Self-review follows
`doc/review-guidelines.md`; no dependencies, user settings, release metadata,
or Powerline code were modified.
