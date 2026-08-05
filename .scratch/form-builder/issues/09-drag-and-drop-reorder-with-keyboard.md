# 09 — Drag-and-drop field reordering with keyboard alternative

**What to build:** field and option reordering in the editor via `@formkit/drag-and-drop`, with a keyboard-accessible alternative for both.

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] Fields in the editor can be reordered by pointer drag
- [ ] Fields can be reordered using the keyboard alone (using the library's keyboard affordance)
- [ ] `FieldOption`s inside choice fields can also be reordered by pointer and by keyboard
- [ ] A reorder gesture that ends at the same position as it started does not commit a `HistoryStep`
- [ ] A reorder gesture that actually changes the order commits exactly one `HistoryStep`
- [ ] Focus stays on the moved item after a keyboard reorder
