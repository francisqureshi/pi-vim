# Compact and status mode labels — maintainer terminal QA

This runbook is outside the published npm tree. Automated counterparts live in
`test/mode-label.test.ts`, `test/settings.test.ts`, and `test/modal-editor.test.ts`.
No editing semantics change; nvim parity cases and unrelated skipped cases are
out of scope for this intentional Pi UI divergence (label wording and placement),
not an nvim feature.

## Automated real-terminal evidence

An isolated Pi 1.3.0 pseudo-terminal smoke test passed with this checkout and
`piVim.modeLabelStyle: "compact"`. It verified I/N/V/VL, `:check_` without a
doubled colon, the `N 2d3f_` pending tail and cancellation, plus integration with
pi-bookmarks' left-padding indicators, Shift+G, two marks, resize and `/reload`.
No model requests or personal configuration changes were made by the test.
Reproduce from a sibling [pi-bookmarks](https://github.com/francisqureshi/pi-bookmarks) checkout:

```sh
PI_VIM_EXTENSION="$PWD/index.ts" uv run --with pyte python ../pi-bookmarks/test/pty-smoke.py --vim-first --compact-labels
```

## Automated Powerline evidence

A real Pi 1.3.0 pseudo-terminal run with pi-powerline-footer 0.20.2 passed
`modeLabelPlacement: "status"` and compact labels. It checked initial I, N, V,
VL, `:check_`, and `N 2d3f_`, each appearing once in the leftmost Powerline item
and not in the editor border. With the Powerline fork's `padding: 0` and
`--flush-left`, the same test also verified that mode/EX/pending blocks begin at
absolute terminal column zero. Their painted text has one leading and trailing
inner space, so the visible mode letter begins at column one. Two transcript marks, Shift+G, resize and reload
also passed, with zero model requests. Reproduce from the sibling checkout:

```sh
PI_VIM_EXTENSION="$PWD/index.ts" \
PI_POWERLINE_EXTENSION=/path/to/pi-powerline-footer/index.ts \
uv run --with pyte python ../pi-bookmarks/test/pty-smoke.py --powerline --compact-labels
```

## Status-placement manual checks

The additional checks below are a runbook, not recorded passing evidence. Use disposable global
and project settings; restart Pi after each configuration change.

- With no Powerline installed, set `piVim.modeLabelPlacement` to `status`.
  Verify Pi's status area shows the mode and the editor no longer duplicates it.
  Cycle INSERT → NORMAL → VISUAL → V-LINE → NORMAL with `modeLabelStyle: full`,
  then repeat with `compact` for `I`, `N`, `V`, and `VL`.
- Enter EX with `:tree` without submitting. Full style shows `EX :tree_`;
  compact shows `:tree_`, with one colon. Cancel with Escape and verify the
  status returns to NORMAL/N with no stale command. Check bare-colon Backspace
  cancellation too.
- Enter `2d3f`, `2r`, and `g`, cancelling between checks. Verify pending/count
  feedback appears in the status label and clears on cancellation or completion.
- Type a long EX line containing combining accents, wide CJK characters, and a
  joined emoji. With the footer's outer padding disabled, confirm the painted
  block begins at column zero, with balanced inner spaces (` I `). At one
  available column, the inner spacer may consume the entire budget; fitting
  must still respect the bound. Editor placement keeps its existing spacers.
  Resize below and above 32 columns: the status payload must fit
  within `min(width, 32)` terminal cells, with no split graphemes, raw escapes,
  wrapping, or stale tails when it shrinks. Check pending feedback at narrow
  widths too; fitting may truncate content.
- Repeat default/custom colors and `labelSync: mode`, `host`, and `thinking`
  checks per mode. Compare with editor placement: reverse video and color
  policy must remain unchanged, including while the host thinking color changes.
- With an optional Powerline footer, include `pi-vim-mode` in its `customItems`
  list. Repeat mode, EX, pending, color, and resize checks; confirm one mode item
  and no editor duplicate. No Powerline installation should be needed for the
  preceding native-Pi checks.
- With an editor-wrapping extension, repeat mode changes, EX cancellation,
  resizing, and `/reload`; check for missing, duplicated, or stale status labels.
- Remove `modeLabelPlacement` and restart: the editor label returns and no
  `pi-vim-mode` status label remains. Verify explicit `editor` behaves likewise.
  A project `editor` or invalid value must override global `status` to editor;
  project `status` must override global `editor`. Verify style remains
  independently full/compact. Restore any manually changed configuration.

## Remaining editor-placement manual checks

Physical-terminal/color/IME checks below are not replaced by the automated test:

- In a disposable project, set `piVim.modeLabelStyle` to `compact` in
  `.pi/settings.json` and start a new Pi session. Verify `I`, Escape → `N`,
  `v` → `V`, `V` → `VL`, Escape then `:tree` → `:tree_` (one colon).
  Escape cancels EX; do not submit commands merely to test their label.
- Enter counts and pending commands (`2d3f`, `2r`, `g`), cancelling between
  checks. Verify the tails and cursor underscore remain visible.
- Resize the terminal down to narrow widths. In EX, type combining accents,
  wide CJK characters, and a joined emoji. Check no split graphemes or footer
  overflow, including after resizing back to normal width.
- Check default/custom mode colors, reverse video, and `labelSync` host/thinking
  settings, both directly and with any editor-wrapping extension in use.
- Remove the setting and restart: full labels must return. Check a project
  `full` or invalid value overrides a global `compact`, using disposable
  configuration only. Restore any manually changed configuration afterward.
