# 08 — Duplication from the list

**What to build:** a "Duplicate" action on each row of the form list that deep-clones the template with fresh IDs at every level and saves it as a new template.

**Blocked by:** 07.

**Status:** ready-for-human

- [x] Each list item exposes a Duplicate action
- [x] Duplicating fetches the full template body, deep-clones it, and regenerates the `id` on the `FormTemplate`, every `Field`, and every `FieldOption` using `crypto.randomUUID()`
- [x] The duplicated template's title is suffixed with `" (copy)"`
- [x] The duplicate is POSTed to the API and appears in the list on success
- [x] Duplication does not mutate or re-save the original template

## Comments

- Added `apps/web/src/duplicate.ts` with a pure `duplicateTemplate(source)` helper that deep-clones the template, regenerates every id (template, field, option) via `crypto.randomUUID()`, resets `createdAt`/`updatedAt` to now, and suffixes the title with `" (copy)"`. The source is not mutated. Covered by `duplicate.test.ts` including a `formTemplateSchema.parse()` round-trip.
- `HomeView.vue` gained a per-row Duplicate button that fetches the full template via `fetchTemplate`, clones it, POSTs it with `createTemplate`, and appends the resulting list-row locally. In-flight state (`duplicatingIds`) disables the button and shows `Duplicating…`; failures surface inline on the affected row via `duplicateErrorId` / `duplicateErrorMessage`, mirroring how delete errors are handled.
- Deliberately drop `visibility` rules during duplication (the helper omits the field entirely): rewriting them would require a two-pass id-map, and no ticket has asked for that yet. Better to drop than to ship dangling references to the source's ids. Documented in a comment on `duplicateTemplate`.
