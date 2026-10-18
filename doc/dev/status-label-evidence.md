# Status mode-label evidence (2026-10-18)

This is a presentation feature, not a render optimization. The replay harness
accepts an optional `editor|status` placement (default `editor`). It covers
all 48 fixtures documented in `compact-label-evidence.md`: 20/80/120 columns,
short/long Unicode prompts, plain/ANSI paint, and insert/normal/EX-hit/EX-miss;
100 warmup renders, seven samples of 100 renders. The compact-label document
records the upstream baseline before either feature was implemented; the
measurements below isolate the subsequent status-placement addition.

## Before and after

Before changing runtime sources for status placement, ran:

```sh
node --import tsx/esm script/render-label-bench.ts full > /tmp/status-before-full.json
node --import tsx/esm script/render-label-bench.ts compact > /tmp/status-before-compact.json
```

After implementation, ran the same commands to `/tmp/status-after-full.json`
and `/tmp/status-after-compact.json`, plus:

```sh
node --import tsx/esm script/render-label-bench.ts compact status > /tmp/status-after-status.json
```

Environment: Node v24.19.0, linux/x64, AMD Ryzen 7 5800X. The mock terminal
uses the real API name `columns` instead of unused `cols`; all render widths
remain explicit and identical. The status callback adds label lengths to the
checksum, simulating publication without invoking a real footer.

Arithmetic means of the per-fixture median microseconds/render follow, with
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
it includes callback labels and unmodified borders. Status avoids border
truncation, but this benchmark does **not** measure Powerline rendering,
terminal latency, idle invocation rates, or callback work during input
(input replay remains outside the timed region). No speedup is claimed.

## Final formatting and terminal checks

Status publication fits the same label used by editor placement into
`min(width, 32)` cells, reserving its trailing inner space before fitting and
then applying colors. Narrow-width regressions exercise both styles, overflow,
Unicode EX text, and painted padding; below three cells the mode may be
entirely clipped. Both inner spaces belong to the
painted block (for example ` I `); the optional footer controls its own outer
padding independently. No asymmetric/flush-left formatting option is added.
The final status-render replay returned the same 17094168 checksum. Its
means of fixture medians were 166.42 / 185.48 / 156.39 µs at 20/80/120
columns. Different shared-machine contention makes these figures unsuitable
for claiming a speedup or performance equivalence.

Real Pi 1.3.0 PTY checks cover mode/EX/count feedback, Powerline placement,
no duplicate editor label, symmetric inner padding, resize, and reload, with
zero model requests. Reproduction and remaining physical-terminal/manual
checks are recorded in `compact-label-qa.md`.

## Packaging and review

The PR package measures 60483 B packed / 238016 B unpacked, versus the
upstream baseline of 58576 B / 231210 B. Budgets move from 59000 / 231400
to 61000 / 240000 to cover both settings, status lifecycle/callback machinery,
fitting prefixes, and user documentation. The package still has 17 files,
no new runtime dependencies, and no shipped test/benchmark/QA files.

Status placement is an intentional Pi UI integration, not an nvim editing
feature; no motion/operator semantics or parity cases change. Tests cover
configuration precedence/malformed containers, feedback, bounded width,
deduplicated publication, theme repaint, submit, factory initialization,
session replacement, shutdown and stale-editor suppression. The default
editor-rendering branch is unchanged. Input/publication measurements and their
limitations are in `status-input-evidence.md`. Cursor-runtime lifecycle tests
cover editor replacement, repeated sessions, both captured hardware-cursor
settings, and idempotent shutdown. `npm run check` passes all 957 tests, lint,
and typecheck; the regenerated scoreboard records 321 nvim-parity passes and
23 existing documented skips. Package checks pass. Self-review follows
`doc/review-guidelines.md`; no release metadata or Powerline code changes.
