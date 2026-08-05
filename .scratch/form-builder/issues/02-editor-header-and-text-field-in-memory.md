# 02 — Editor: header + first field type (`text`), fully in-memory

**What to build:** the `/forms/:id/edit` route with a working editor for the form header (title, description) and a single `text` field. Add, edit, delete, mark required — all in memory, no persistence yet. This is the first vertical slice through the editor and proves the Pinia store shape and mutation surface for one field variant.

**Blocked by:** 01.

**Status:** ready-for-human

- [x] `/forms/:id/edit` route registered in vue-router
- [x] A Pinia store owns the current `FormTemplate` in memory, seeded on route entry with a fresh template titled `Untitled Form`
- [x] The form title and description are editable inline in the editor header
- [x] The form creator can add a `text` field
- [x] For a `text` field, the creator can edit the label, edit the helper description, edit the placeholder, toggle required, and delete the field
- [x] All mutations flow through named store actions (not direct state edits) so a future undo/redo layer can wrap them
- [x] Types from `packages/shared` are used throughout; no `any` in the store or components
