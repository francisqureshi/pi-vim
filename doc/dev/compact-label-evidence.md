# Compact mode-label render evidence

## Replay

Run from the repository root:

```sh
node --import tsx/esm script/render-label-bench.ts full > /tmp/render-full.json
node --import tsx/esm script/render-label-bench.ts compact > /tmp/render-compact.json
```

The committed harness measures complete `ModalEditor.render` calls, not just
label generation. Its 48 fixtures cross widths 20 (narrow), 80 and 120; short
and long prompts; plain and ANSI border/label colorizers; and insert, normal,
EX cache-hit and changing-pending-EX cache-miss states. Prompts and EX commands
contain CJK, a ZWJ emoji and (in prompts) a combining accent. The long prompt
repeats a 49-code-unit phrase 40 times. Input replay happens outside the timed
region: EX misses alternate appending `x` and backspacing it. Stable states
re-render unchanged input. Each fixture warms up for 100 renders, then records
seven samples of 100 renders. Results are microseconds/render, median of those
seven sample means; JSON includes every sample and an output-length checksum.

This is a headless render replay, not terminal latency or idle invocation
instrumentation. No cursor-shape runtime is installed. Timings include the
host editor, label fitting, footer cache, colorizers and timer overhead; they
do not attribute cost to individual calls or establish the strategy's >5%
footer-width threshold. Fixed fixture order and shared-machine noise limit
small-difference interpretations. Repeat runs before treating any delta as a
regression or improvement. No additional cache optimization is justified here.

## Before/after observation (2026-10-18)

Baseline root TypeScript files were copied **before implementation edits** to
`/tmp/pi-vim-label-baseline.czvyHg`, with the same `node_modules` symlink and
package manifest. Repository HEAD was
`e55b07c05b648f3bbccf656c2b0c6ec63f1a91d1`. The baseline ignores the new
`modeLabelStyle` option. The identical benchmark was copied into its `script/`
directory and run with `full`; this avoids comparing against moving source.
The initial after columns were measured from the working tree once compact
style was available. Final-tree repeat measurements follow below.

Environment: Node v24.19.0, linux/x64, AMD Ryzen 7 5800X 8-Core Processor.
Each cell lists **insert / normal / EX hit / EX miss**, in microseconds/render.

| Width | Prompt | Paint | Before full | After full | After compact |
| --- | --- | --- | --- | --- | --- |
| 20 | short | plain | 3.41/5.04/5.15/10.24 | 3.37/5.70/6.01/8.18 | 3.61/5.26/5.91/11.93 |
| 20 | short | ANSI | 3.15/7.64/8.09/29.51 | 2.15/5.75/6.65/26.29 | 3.15/8.03/8.17/22.05 |
| 20 | long | plain | 229.08/232.21/231.74/236.44 | 228.36/230.37/233.29/238.28 | 228.08/230.77/229.61/236.26 |
| 20 | long | ANSI | 226.26/294.60/235.30/254.52 | 225.57/226.96/229.63/249.93 | 225.39/227.67/233.11/265.05 |
| 80 | short | plain | 1.28/3.39/3.55/21.47 | 1.28/3.44/3.62/21.23 | 1.27/3.27/3.33/23.02 |
| 80 | short | ANSI | 2.82/7.11/7.23/268.09 | 2.88/5.04/5.19/268.40 | 2.88/7.06/7.28/279.33 |
| 80 | long | plain | 217.85/220.06/220.43/251.53 | 226.39/227.82/227.38/250.52 | 227.63/229.01/218.95/239.55 |
| 80 | long | ANSI | 230.33/234.33/233.94/533.51 | 225.87/229.64/229.89/465.25 | 219.82/221.98/233.02/578.74 |
| 120 | short | plain | 1.36/3.61/3.66/30.14 | 1.37/3.59/3.69/31.30 | 1.35/3.48/3.65/33.05 |
| 120 | short | ANSI | 3.68/5.97/6.02/210.05 | 3.67/5.88/6.10/210.97 | 3.73/5.98/6.02/385.47 |
| 120 | long | plain | 226.28/230.38/231.14/260.31 | 296.00/217.43/218.55/262.11 | 226.02/230.40/232.99/269.62 |
| 120 | long | ANSI | 221.13/224.24/223.98/771.68 | 227.02/231.60/233.00/691.06 | 233.01/237.11/238.72/784.86 |

Checksums: before full 14856000; after full 14856000; after compact 15624000.
Raw samples are retained locally in the baseline directory's `baseline.json`,
`/tmp/pi-vim-label-after-full.json` and `/tmp/pi-vim-label-after-compact.json`.
The table above is the committed baseline; temporary files are not required
to rerun the harness.

Stable 80-column long-prompt results are broadly similar, but compact ANSI
EX misses include a substantial slowdown (notably 120-column short prompts:
210.97 → 385.47 µs). This run does **not** establish performance equivalence;
repeat and investigate that path before claiming no regression. Compact labels
leave more colored footer content to truncate on misses, so shorter labels
must not be assumed to imply cheaper rendering. The proposed feature is a
presentation choice, not a demonstrated performance optimization.

## Final-tree repeat

Same commands and baseline snapshot, after implementation/tests settled:

| Width | Prompt | Paint | Before full | After full | After compact |
| --- | --- | --- | --- | --- | --- |
| 20 | short | plain | 3.49/5.12/5.86/11.03 | 3.60/6.23/6.32/10.50 | 3.26/5.17/5.19/10.74 |
| 20 | short | ANSI | 3.18/6.26/7.98/27.04 | 3.31/6.50/8.34/32.48 | 3.08/6.13/7.98/22.44 |
| 20 | long | plain | 224.52/233.76/228.38/237.02 | 227.72/229.41/228.82/235.11 | 226.22/231.61/230.86/235.47 |
| 20 | long | ANSI | 224.22/276.29/232.69/231.01 | 225.37/227.67/243.84/249.72 | 225.87/227.80/257.82/268.29 |
| 80 | short | plain | 1.29/3.53/3.58/22.12 | 1.32/3.48/3.60/22.17 | 1.29/3.42/3.53/21.91 |
| 80 | short | ANSI | 2.88/5.20/6.97/273.47 | 2.87/7.10/7.10/259.10 | 2.85/5.36/7.18/271.13 |
| 80 | long | plain | 225.28/228.33/230.64/252.66 | 218.08/221.20/221.95/256.39 | 226.68/228.82/219.46/239.54 |
| 80 | long | ANSI | 218.16/221.52/221.84/429.87 | 228.10/233.12/235.28/514.42 | 218.08/224.10/223.69/570.73 |
| 120 | short | plain | 1.39/3.59/3.68/31.78 | 1.41/3.70/3.71/31.73 | 1.39/3.65/3.72/31.62 |
| 120 | short | ANSI | 3.74/9.30/6.01/363.34 | 3.75/6.07/6.13/212.46 | 3.70/6.13/6.21/366.26 |
| 120 | long | plain | 217.14/219.95/220.10/264.37 | 226.20/232.92/233.88/252.86 | 229.91/233.77/234.73/263.54 |
| 120 | long | ANSI | 227.89/231.95/232.68/652.04 | 220.38/223.07/223.55/755.34 | 229.76/232.28/223.61/771.84 |

Raw repeat results: baseline directory `baseline-final.json`,
`/tmp/pi-vim-label-final-full.json`, `/tmp/pi-vim-label-final-compact.json`.
Stable 80-column long-prompt frames remain about 0.22–0.24 ms. ANSI EX misses
are variable even on unchanged baseline code (120-column short: 210.05 then
363.34 µs); compact remains slower than after-full in that fixture across both
runs, but matches the repeated baseline. Compact also renders a different
amount of colored footer content. These observations do not isolate a causal
regression or justify changing the existing truncation/cache implementation.
No optimization is included; the optional presentation tradeoff is documented
rather than claiming performance equivalence. Manual terminal responsiveness
remains a maintainer check in `compact-label-qa.md`.

## Packaging and verification

A clean `git archive HEAD` package dry-run measured 58576 B packed / 231210 B
unpacked. The initial compact-only feature measured 59102 B / 232997 B;
a later compact-only snapshot measured 59229 B / 233305 B after malformed
configuration handling and documentation were hardened. These are historical
snapshots, not the combined PR footprint: `status-label-evidence.md` records
the combined feature's final package and budget rationale. Benchmarks,
tests, evidence, and QA runbook are not shipped. The compact-only snapshot
passed 938 unit tests, lint, typecheck, and package checks. The scoreboard is
regenerated for the combined PR, including nvim parity; no parity cases
change for this display-only feature.
