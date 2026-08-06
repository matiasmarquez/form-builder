# 11 — Accessibility polish sweep

**What to build:** a deliberate a11y pass across the entire interactive surface once editor, DnD, and preview are complete.

**Blocked by:** 00, 09, 10.

**Status:** resolved

- [x] Every input has a properly associated `<label>` or `aria-labelledby`
- [x] Radio and checkbox groups are wrapped in semantic `<fieldset>` with a `<legend>` derived from the field label
- [x] Helper descriptions are linked to their input via `aria-describedby`
- [x] Every interactive element has a visible focus state (Tailwind ring or equivalent), including custom drag handles and buttons
- [x] Validation errors are announced by screen readers when they appear (`role="alert"` verified for each field type)
- [x] The Outfit font weights, sizes, and line-heights are reviewed for readability at default zoom
- [x] Colour contrast on text, borders, and focus rings meets WCAG AA
- [x] The full editor is operable using only the keyboard, including field reorder (already delivered in 09; this sweep verifies it holistically)

## Answer

Accessibility polish landed across editor + preview:

- Proper `for`/`id` labels on editor field config inputs; option labels via `sr-only` + `for`; autosave/required checkboxes labeled.
- Preview radio/checkbox groups use a visible `<legend>` (field label) inside `<fieldset>`; text/paragraph/select keep `<label for>`.
- `joinAriaDescribedBy` links description + error ids; errors keep `role="alert"`.
- `FOCUS_RING_CLASSES` applied to handles, option inputs, checkboxes, drawer close, segmented nav, preview back-link.
- Nested buttons in collapsed field cards removed (handle is a sibling of the expand control).
- Typography: `leading-tight` / `leading-snug` / `leading-relaxed` on display/heading/label/body roles.
- Contrast: light `muted-fg` → neutral-600; dark ring → emerald-400; `border-strong` → neutral-500 (WCAG 1.4.11).
- Keyboard reorder re-verified in browser (ArrowUp/ArrowDown on field handles; no nested `<button>`).
