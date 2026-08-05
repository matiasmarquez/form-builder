# 07 — Form list at `/`, open into editor, delete

**What to build:** the `/` route now shows a list of saved templates fetched from the API, with links to open each in the editor or preview, and a delete action. This replaces the hardcoded seeded-template rendering from ticket 01.

**Blocked by:** 05.

**Status:** ready-for-agent

- [ ] `/` fetches `GET /templates` and renders a list showing each template's title and last-updated time
- [ ] Templates are ordered by `updated_at` descending
- [ ] Each list item has clear affordances to open in the editor (`/forms/:id/edit`) and open in the preview (`/forms/:id/preview`)
- [ ] Each list item has a delete action that requires an explicit confirmation and, on confirm, calls `DELETE /templates/:id` and removes the row from the list
- [ ] A "Create new form" action creates a fresh `FormTemplate` (client-generated UUID, default title `Untitled Form`) and navigates to its edit route; it does not need to save before navigation
- [ ] An empty state is shown when no templates exist
