# 09 — Drag-and-drop field reordering with keyboard alternative

**What to build:** field and option reordering in the editor via `@formkit/drag-and-drop`, with a keyboard-accessible alternative for both.

**Blocked by:** 04.

**Status:** ready-for-human

- [x] Fields in the editor can be reordered by pointer drag
- [x] Fields can be reordered using the keyboard alone (using the library's keyboard affordance)
- [x] `FieldOption`s inside choice fields can also be reordered by pointer and by keyboard
- [x] A reorder gesture that ends at the same position as it started does not commit a `HistoryStep`
- [x] A reorder gesture that actually changes the order commits exactly one `HistoryStep`
- [x] Focus stays on the moved item after a keyboard reorder

## Notes

- Pointer drag is wired via `@formkit/drag-and-drop`'s `useDragAndDrop` in `apps/web/src/composables/useReorderableList.ts`. The composable owns a reactive `ids` array that mirrors the store's field/option order one-way and commits the finalised order on `onDragend`.
- The library doesn't ship a built-in keyboard affordance; the accessibility example in its docs is hand-rolled. We surface a focusable "reorder" handle button on every field and option with `ArrowUp` / `ArrowDown` to move the item by one slot. Focus follows the moved element (Vue keeps the DOM node for the same `:key`, so focus is preserved naturally after reorder).
- The store now exposes `reorderFields(newOrder)` and `reorderFieldOptions(fieldId, newOrder)` which take the final ordering as a list of ids and push exactly one `HistoryStep`. Both no-op (no step) when the new order equals the current order — that's what enforces "ends where it started ⇒ no step" regardless of gesture flavour.
