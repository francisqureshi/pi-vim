# Compact mode labels — maintainer terminal QA

This runbook is outside the published npm tree. Automated counterparts live in
`test/mode-label.test.ts`, `test/settings.test.ts`, and `test/modal-editor.test.ts`.
No editing semantics change; nvim parity cases and unrelated skipped cases are
out of scope for this pi-vim-specific footer presentation.

## Automated real-terminal evidence

An isolated Pi 1.3.0 pseudo-terminal smoke test passed with this checkout and
`piVim.modeLabelStyle: "compact"`. It verified I/N/V/VL, `:check_` without a
doubled colon, the `N 2d3f_` pending tail and cancellation, plus integration with
pi-bookmarks' left-padding indicators, Shift+G, two marks, resize and `/reload`.
No model requests or personal configuration changes were made by the test.
Reproduce from a sibling pi-bookmarks checkout:

```sh
PI_VIM_EXTENSION="$PWD/index.ts" uv run --with pyte python ../pi-bookmarks/test/pty-smoke.py --vim-first --compact-labels
```

## Remaining manual checks

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
