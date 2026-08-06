# 10 — Preview at `/forms/:id/preview` with validation UX

**What to build:** the respondent-facing preview route with functional controls for every field type and the full validation experience on submit and on blur-after-first-submit.

**Blocked by:** 04, 05.

**Status:** ready-for-human

- [x] `/forms/:id/preview` route fetches the template and renders the title, description, and every field with functional controls appropriate for its type (single-line input, multi-line textarea, checkbox list, radio group, select dropdown)
- [x] Required fields carry a clear visual indicator
- [x] Helper descriptions render below each label
- [x] A separate Pinia store holds the `FormResponse` (per-field `Answer` values and per-field touched state)
- [x] Before the first submit attempt, no validation errors are shown
- [x] On the first submit attempt, if any required visible field is empty, submission is blocked, an inline error appears under each invalid field, and the first invalid field is scrolled into view and focused
- [x] From the first submit attempt onwards, each field re-validates on blur
- [x] Errors are rendered with `role="alert"` and linked to their input via `aria-describedby`; the message is a generic "This field is required"
- [x] A successful submit shows a clear confirmation state; no HTTP request is sent (client-only simulation)
- [x] For choice fields, the selected `OptionId`(s) are validated to be members of the field's current `options`
