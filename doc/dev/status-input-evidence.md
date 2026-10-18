# Mode-label input/publication evidence (2026-10-18)

This supplements the render-only measurements in `status-label-evidence.md`.
It measures the complete synchronous `ModalEditor.handleInput` call, including
status fitting, painting, deduplication and callback work. It is not an
optimization claim or a measurement of a real footer.

## Harness and frozen sources

`script/mode-label-input-bench.ts` runs eight fixtures: widths 12 and 80 crossed
with INSERT typing/backspace, NORMAL h/l, pending `2d3f` then Escape, and a long
EX command. Each fixture begins with `Hello 界 👩‍💻 é draft`. EX setup enters a
colon followed by `echo é界👩‍💻 ` repeated 40 times (560 UTF-16 code units after
the colon), then alternates a complete ZWJ emoji and grapheme backspace. The
combining accent, CJK and ZWJ text overflows both status budgets, 12 and 32 cells.
Pending counts are canceled, not executed; these are label/publication replays,
not new motion/operator benchmarks.

Each key is timed around `handleInput`, then immediately around `render`.
Five samples each replay 40 complete cycles after 20 warmup cycles; a cycle has
2 keys, or 5 for pending counts. Values below are microseconds per key/frame,
not per cycle. Total is input plus render in the same sample; its median need
not equal the sum of the independently computed phase medians. Construction,
initial prompt/EX setup and the initial render are outside timing. No editors
are constructed inside timed samples.

All fixtures use ANSI magenta paint and reverse-video labels in both sources;
“full/editor” means the default style and placement, not a comparison of all
color policies. The callback increments a publication counter and hashes every
UTF-16 code unit of the painted label into an unsigned 32-bit FNV-style
checksum. That callback work is **inside** input/render timing. Rendered rows,
buffer text, cursor and mode are also hashed, **outside** timing. Checksums and
callback counts include setup and warmup. The callback does not call `setStatus`
or request/render a footer. The mock TUI's `requestRender` does nothing; this
harness explicitly renders once per key. No cursor-shape terminal is installed.

Baseline is frozen upstream `e55b07c05b648f3bbccf656c2b0c6ec63f1a91d1`, not a
moving branch. The identical harness is copied into it; upstream ignores the
new label options. Candidate is `b64549f` plus the narrow-status-padding fix,
frozen separately before either candidate configuration was measured. Only the
benchmark and this document were added for this input-path evidence.

Actual snapshot paths were `/tmp/pi-vim-input-baseline.BBfsdu` and
`/tmp/pi-vim-input-after.Tz9TCl`. SHA-256:

- Identical harness in both snapshots:
  `e35f111a33bf0dcbdd7444f416ba1db308d539447beaef9836963ec2075906a0`
- Candidate `index.ts`:
  `480ea577813d69dd5b6edff19987e7d930641d8269e48559d8cdff31efae3d81`

Environment: Node v24.19.0, linux/x64, AMD Ryzen 7 5800X 8-Core Processor.
The same installed dependencies are symlinked into both snapshots. Commands
from the candidate checkout (temporary directory suffixes will differ):

```sh
BASE=$(mktemp -d /tmp/pi-vim-input-baseline.XXXXXX)
git archive e55b07c05b648f3bbccf656c2b0c6ec63f1a91d1 | tar -x -C "$BASE"
ln -s "$(realpath node_modules)" "$BASE/node_modules"
cp script/mode-label-input-bench.ts "$BASE/script/"
AFTER=$(mktemp -d /tmp/pi-vim-input-after.XXXXXX)
git archive HEAD | tar -x -C "$AFTER"
cp ./*.ts "$AFTER/"
cp script/mode-label-input-bench.ts "$AFTER/script/"
ln -s "$(realpath node_modules)" "$AFTER/node_modules"
for RUN in 1 2; do
  (cd "$BASE" && node --import tsx/esm script/mode-label-input-bench.ts full editor) > "/tmp/pi-vim-input-before-$RUN.json"
  (cd "$AFTER" && node --import tsx/esm script/mode-label-input-bench.ts full editor) > "/tmp/pi-vim-input-full-$RUN.json"
  (cd "$AFTER" && node --import tsx/esm script/mode-label-input-bench.ts compact status) > "/tmp/pi-vim-input-status-$RUN.json"
done
```

Each invocation is a fresh process. Runs were sequential in the order above,
not parallel. JSON includes all input, render and total samples, medians,
checksums, callback counts and environment. Temporary JSON is not required to
reproduce the measurements; input samples are also recorded below.

## Repeated medians

Each cell is **input / render / total**, µs per key. B = frozen upstream
full/editor, F = candidate full/editor, S = candidate compact/status.

| Width | Fixture | Run | B | F | S |
| --- | --- | --- | --- | --- | --- |
| 12 | insert | 1 | 43.49 / 18.39 / 62.71 | 42.74 / 18.27 / 62.24 | 44.88 / 16.18 / 61.85 |
| 12 | insert | 2 | 42.26 / 18.41 / 61.83 | 45.36 / 19.59 / 66.22 | 43.10 / 16.54 / 59.64 |
| 12 | normal | 1 | 39.51 / 17.94 / 60.60 | 42.76 / 19.10 / 66.48 | 50.04 / 16.39 / 66.93 |
| 12 | normal | 2 | 45.44 / 18.79 / 66.90 | 45.65 / 18.68 / 65.92 | 40.98 / 15.64 / 56.62 |
| 12 | counts | 1 | 2.33 / 17.47 / 20.21 | 2.50 / 17.58 / 19.65 | 3.65 / 9.80 / 13.46 |
| 12 | counts | 2 | 2.44 / 16.66 / 18.68 | 2.41 / 16.88 / 19.60 | 3.63 / 9.69 / 13.32 |
| 12 | long-ex | 1 | 23.37 / 52.48 / 79.46 | 24.29 / 55.15 / 80.16 | 64.08 / 49.42 / 115.46 |
| 12 | long-ex | 2 | 23.93 / 57.34 / 82.16 | 23.23 / 55.50 / 79.31 | 67.98 / 48.08 / 121.74 |
| 80 | insert | 1 | 25.41 / 5.91 / 31.32 | 24.04 / 5.57 / 29.47 | 25.45 / 3.05 / 28.50 |
| 80 | insert | 2 | 24.88 / 5.81 / 30.61 | 23.06 / 5.52 / 28.58 | 25.74 / 3.11 / 28.86 |
| 80 | normal | 1 | 20.50 / 6.88 / 27.38 | 19.67 / 7.11 / 26.86 | 21.10 / 4.60 / 25.89 |
| 80 | normal | 2 | 20.47 / 7.25 / 27.81 | 20.36 / 7.02 / 27.32 | 20.06 / 4.72 / 24.78 |
| 80 | counts | 1 | 2.82 / 343.84 / 346.66 | 2.95 / 300.19 / 303.78 | 2.93 / 4.26 / 7.21 |
| 80 | counts | 2 | 3.11 / 344.26 / 347.37 | 3.22 / 340.84 / 344.07 | 2.88 / 4.20 / 7.08 |
| 80 | long-ex | 1 | 20.32 / 47.28 / 67.60 | 20.46 / 46.84 / 67.48 | 59.71 / 41.41 / 101.30 |
| 80 | long-ex | 2 | 20.35 / 46.99 / 67.34 | 20.87 / 46.94 / 67.34 | 59.43 / 40.91 / 100.48 |

Status has a repeatable **long-EX regression**, not equivalence: input grows
from approximately 20–24 to 59–68 µs; total grows from approximately 67–82 to
100–122 µs. At 80 columns, input is roughly 2.9× baseline and total roughly
1.5×. Publication now fits/paints during input, and render re-evaluates it even
when the callback is deduplicated. The 12-column pending-count input also rises
from approximately 2.3–2.4 to 3.6 µs. These opt-in costs should remain explicit
in review; this evidence does not waive them or include an optimization.

Default full/editor results include increases too (12-column INSERT run 2:
42.26 → 45.36 µs input; NORMAL run 1: 39.51 → 42.76). They are not consistently
repeated and do not establish a causal default regression or equivalence.
Status's much smaller pending-count render time is not an end-to-end speedup:
it omits the editor's ANSI border truncation, and no replacement footer is
rendered here. Existing ANSI truncation/JIT effects make those editor samples
especially variable. The longest individual sample mean total was 681.54 µs
(candidate full/editor, 80-column EX); all outliers remain in the JSON/samples.

No CPU pinning, explicit GC control, randomization or exclusive-machine control
was used. Fixed fixture order and short warmup leave JIT/GC and scheduling noise
visible. Samples are means of short batches, not latency percentiles. This
measures synchronous input plus one synchronous render, not render scheduling,
idle invocation rate, native Pi status layout, Powerline, terminal I/O, physical
keystroke latency, memory growth or all label/color combinations. Do not infer
interactive responsiveness or feature performance equivalence from these data.

## Observable checksums and publication

Each value below matched between runs 1 and 2. Baseline and candidate
full/editor checksums match exactly. Status differs intentionally because it
hashes publications and unmodified editor borders. Counts are setup + warmup +
samples; stable INSERT/NORMAL labels publish only initially/on mode entry,
while pending and EX feedback publish on each change.

| Width | Fixture | B = F checksum | S checksum | S callback count |
| --- | --- | --- | --- | --- |
| 12 | insert | 3804499833 | 2118469564 | 1 |
| 12 | normal | 1161718453 | 1228239994 | 2 |
| 12 | counts | 2472614609 | 3461833002 | 1102 |
| 12 | long-ex | 2807107441 | 2330994271 | 444 |
| 80 | insert | 2843388265 | 4174800252 | 1 |
| 80 | normal | 1320416197 | 1551597354 | 2 |
| 80 | counts | 3968975525 | 1545205914 | 1102 |
| 80 | long-ex | 2300447769 | 3322691085 | 444 |

## Input sample means

All five samples in execution order, µs per key, rounded to two decimals. These
are the newly covered input/publication path; render/total samples are emitted
by the same harness and their repeated medians appear above.

| Source/run | Width | Fixture | Input samples |
| --- | --- | --- | --- |
| B1 | 12 | insert | 93.15, 44.68, 43.49, 41.42, 41.26 |
| B1 | 12 | normal | 46.69, 42.66, 39.51, 34.11, 33.85 |
| B1 | 12 | counts | 2.78, 2.87, 2.33, 1.84, 2.22 |
| B1 | 12 | long-ex | 24.40, 70.43, 21.14, 22.17, 23.37 |
| B1 | 80 | insert | 28.87, 25.41, 25.59, 23.88, 23.94 |
| B1 | 80 | normal | 20.87, 21.73, 20.50, 19.67, 19.08 |
| B1 | 80 | counts | 3.24, 2.82, 3.40, 2.06, 2.26 |
| B1 | 80 | long-ex | 20.32, 20.21, 20.97, 21.16, 20.18 |
| B2 | 12 | insert | 91.49, 42.26, 44.07, 41.74, 42.07 |
| B2 | 12 | normal | 45.50, 44.06, 45.44, 35.19, 98.79 |
| B2 | 12 | counts | 3.56, 3.37, 2.44, 1.89, 2.02 |
| B2 | 12 | long-ex | 25.81, 23.51, 21.75, 24.25, 23.93 |
| B2 | 80 | insert | 30.43, 25.50, 24.65, 24.25, 24.88 |
| B2 | 80 | normal | 20.59, 20.47, 21.25, 19.66, 19.63 |
| B2 | 80 | counts | 3.33, 3.11, 3.77, 2.27, 2.40 |
| B2 | 80 | long-ex | 20.35, 20.28, 615.69, 20.32, 20.47 |
| F1 | 12 | insert | 96.67, 42.61, 43.59, 42.22, 42.74 |
| F1 | 12 | normal | 47.38, 42.76, 128.54, 38.80, 29.88 |
| F1 | 12 | counts | 3.01, 3.05, 2.50, 2.00, 2.07 |
| F1 | 12 | long-ex | 25.04, 70.26, 21.72, 23.20, 24.29 |
| F1 | 80 | insert | 30.04, 25.19, 24.04, 23.76, 23.46 |
| F1 | 80 | normal | 19.63, 19.75, 19.67, 19.78, 18.89 |
| F1 | 80 | counts | 3.59, 2.95, 3.62, 2.25, 2.53 |
| F1 | 80 | long-ex | 20.46, 20.67, 630.79, 20.37, 20.22 |
| F2 | 12 | insert | 92.47, 47.15, 45.36, 43.03, 42.19 |
| F2 | 12 | normal | 45.65, 46.97, 108.11, 35.41, 33.05 |
| F2 | 12 | counts | 2.95, 2.72, 2.41, 1.95, 2.18 |
| F2 | 12 | long-ex | 25.98, 23.23, 21.43, 22.58, 23.81 |
| F2 | 80 | insert | 28.62, 23.61, 23.06, 22.31, 22.84 |
| F2 | 80 | normal | 20.38, 20.95, 20.36, 19.76, 19.11 |
| F2 | 80 | counts | 3.31, 3.22, 3.71, 2.40, 2.66 |
| F2 | 80 | long-ex | 20.87, 20.40, 21.06, 20.94, 20.46 |
| S1 | 12 | insert | 45.67, 44.10, 46.22, 44.88, 43.81 |
| S1 | 12 | normal | 50.04, 45.54, 130.44, 35.95, 108.45 |
| S1 | 12 | counts | 4.02, 4.15, 3.65, 2.95, 3.06 |
| S1 | 12 | long-ex | 82.63, 61.50, 64.08, 129.32, 60.61 |
| S1 | 80 | insert | 29.62, 25.45, 24.71, 54.57, 23.87 |
| S1 | 80 | normal | 22.20, 21.10, 21.63, 20.40, 20.12 |
| S1 | 80 | counts | 2.95, 2.92, 3.08, 2.93, 2.73 |
| S1 | 80 | long-ex | 59.82, 58.98, 82.24, 59.71, 59.30 |
| S2 | 12 | insert | 97.17, 41.23, 45.14, 43.10, 41.88 |
| S2 | 12 | normal | 45.97, 44.94, 40.98, 36.67, 35.27 |
| S2 | 12 | counts | 3.84, 4.02, 3.63, 2.92, 2.98 |
| S2 | 12 | long-ex | 84.16, 67.98, 67.22, 134.50, 59.61 |
| S2 | 80 | insert | 28.59, 25.76, 25.37, 24.74, 25.74 |
| S2 | 80 | normal | 20.76, 20.61, 20.06, 19.27, 19.55 |
| S2 | 80 | counts | 2.93, 2.88, 3.03, 2.65, 2.78 |
| S2 | 80 | long-ex | 92.33, 59.12, 84.86, 59.27, 59.43 |

Verification: `npx biome check script/mode-label-input-bench.ts`,
`npx eslint script/mode-label-input-bench.ts`, and `npm run typecheck` passed.
No production code, tests, package budgets or scoreboard were edited for this
benchmark/evidence addition.
