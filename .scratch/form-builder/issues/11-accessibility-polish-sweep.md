# 11 — Accessibility polish sweep

**What to build:** a deliberate a11y pass across the entire interactive surface once editor, DnD, and preview are complete.

**Blocked by:** 09, 10.

**Status:** ready-for-agent

- [ ] Every input has a properly associated `<label>` or `aria-labelledby`
- [ ] Radio and checkbox groups are wrapped in semantic `<fieldset>` with a `<legend>` derived from the field label
- [ ] Helper descriptions are linked to their input via `aria-describedby`
- [ ] Every interactive element has a visible focus state (Tailwind ring or equivalent), including custom drag handles and buttons
- [ ] Validation errors are announced by screen readers when they appear (`role="alert"` verified for each field type)
- [ ] The Outfit font weights, sizes, and line-heights are reviewed for readability at default zoom
- [ ] Colour contrast on text, borders, and focus rings meets WCAG AA
- [ ] The full editor is operable using only the keyboard, including field reorder (already delivered in 09; this sweep verifies it holistically)
