# 03 — Undo/redo with keyboard shortcuts

**What to build:** whole-snapshot undo/redo behind every editor mutation from ticket 02, wired to Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z, with typing-pause coalescing so undo does not walk through every keystroke. See ADR-0003.

**Blocked by:** 02.

**Status:** ready-for-human

- [x] The editor store maintains an undo stack and a redo stack of `HistoryStep`s, each a deep-cloned snapshot of the `FormTemplate`
- [x] Every mutation from ticket 02 commits a `HistoryStep` when it should (add field, delete field, toggle required)
- [x] Label, description, and placeholder edits coalesce into a single `HistoryStep` on a 500ms typing pause or on blur — not per keystroke
- [x] Cmd+Z (macOS) / Ctrl+Z (Windows/Linux) undoes; Cmd+Shift+Z / Ctrl+Shift+Z redoes
- [x] The undo stack is capped (suggested: ~100 entries) and older entries are discarded
- [x] A redo stack is cleared whenever a new mutation is committed after an undo
- [x] Vitest covers: push, undo, redo, cap, coalescing, and that a no-op mutation does not push a step
