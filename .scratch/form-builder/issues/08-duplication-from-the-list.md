# 08 — Duplication from the list

**What to build:** a "Duplicate" action on each row of the form list that deep-clones the template with fresh IDs at every level and saves it as a new template.

**Blocked by:** 07.

**Status:** ready-for-agent

- [ ] Each list item exposes a Duplicate action
- [ ] Duplicating fetches the full template body, deep-clones it, and regenerates the `id` on the `FormTemplate`, every `Field`, and every `FieldOption` using `crypto.randomUUID()`
- [ ] The duplicated template's title is suffixed with `" (copy)"`
- [ ] The duplicate is POSTed to the API and appears in the list on success
- [ ] Duplication does not mutate or re-save the original template
