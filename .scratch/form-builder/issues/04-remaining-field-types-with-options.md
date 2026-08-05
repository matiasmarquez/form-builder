# 04 — Remaining field types: `paragraph`, `checkbox`, `radio`, `select` with options

**What to build:** the four remaining `Field` variants in the editor, including full option management for the three choice-based variants, all participating in undo/redo.

**Blocked by:** 03.

**Status:** ready-for-agent

- [ ] The creator can add a `paragraph` field and edit its label, description, placeholder, and required flag
- [ ] The creator can add a `checkbox`, `radio`, and `select` field and edit each one's label, description, and required flag
- [ ] For each choice field, the creator can add an option, edit an option's label, delete an option, and reorder options via the store (drag UI comes later in ticket 10)
- [ ] Every `FieldOption` has a stable client-generated UUID that survives label edits and reorders
- [ ] All option mutations commit `HistoryStep`s under the same coalescing rules as ticket 03 (typing-pause / blur for label edits, immediate for add/delete/reorder)
- [ ] The `Field` discriminated union from `packages/shared` is used throughout; the renderer switches on `field.type` with exhaustive coverage under strict TS
- [ ] Vitest covers the option-list mutations and their undo/redo interactions
