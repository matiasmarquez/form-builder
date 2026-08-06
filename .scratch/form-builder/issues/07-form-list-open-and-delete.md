# 07 — Form list at `/`, open into editor, delete

**What to build:** the `/` route now shows a list of saved templates fetched from the API, with links to open each in the editor or preview, and a delete action. This replaces the hardcoded seeded-template rendering from ticket 01.

**Blocked by:** 05.

**Status:** ready-for-human

- [x] `/` fetches `GET /templates` and renders a list showing each template's title and last-updated time
- [x] Templates are ordered by `updated_at` descending
- [x] Each list item has clear affordances to open in the editor (`/forms/:id/edit`) and open in the preview (`/forms/:id/preview`)
- [x] Each list item has a delete action that requires an explicit confirmation and, on confirm, calls `DELETE /templates/:id` and removes the row from the list
- [x] A "Create new form" action creates a fresh `FormTemplate` (client-generated UUID, default title `Untitled Form`) and navigates to its edit route; it does not need to save before navigation
- [x] An empty state is shown when no templates exist

## Comments

- Added a shared `templateListItemSchema` / `templateListSchema` (`packages/shared`) so `GET /templates` uses the same zod contract on both sides per ADR-0006. `apps/api/src/templates-repository.ts` imports the type directly from `@form-builder/shared` rather than re-exporting it.
- `apps/web/src/api.ts` gained `fetchTemplateList()` and `deleteTemplate()`. `deleteTemplate` treats 404 as success (the row is already gone, which is what the caller wanted).
- `HomeView.vue` now owns loading/error/empty states, an in-place two-step delete confirmation (`Delete → Confirm delete / Cancel`) to satisfy the "explicit confirmation" requirement without a modal library, and a coarse `formatUpdatedAt` helper for the timestamp column. Delete failures surface inline on the affected row (`deleteErrorId` + `deleteErrorMessage`) rather than being routed through the load-error banner, which is only visible when the initial fetch fails.
- Added a placeholder `/forms/:id/preview` route + `PreviewView.vue` so the Preview link on the list resolves today; ticket 10 will replace the placeholder with the real preview UI.
- Tests: `apps/web/src/api.test.ts` covers the new client (list parse, non-2xx failure, 404-as-success on delete). The suite still lives at the Pinia-store level; adding component-mount tests would require pulling in `@vue/test-utils`, which is out of scope for this ticket.
