# Form Builder — Design System & IA

Frozen visual language and screen-level information architecture for the three existing surfaces (list, editor, preview). Derived from the grilling session on 2026-08-06.

This document is the source of truth for ticket [00-design-system-and-polish](./issues/00-design-system-and-polish.md), and is the target that tickets [11-accessibility-polish-sweep](./issues/11-accessibility-polish-sweep.md) and [14-responsive-polish-sweep](./issues/14-responsive-polish-sweep.md) must conform to.

**Out of scope**: custom respondent-facing form controls, DnD reorder animations, conditional visibility ([12](./issues/12-conditional-visibility.md)), any product-scope expansion.

---

## 1. Visual language

### 1.1 Accent colour

Teal.

- **Light**: primary `teal-600`, hover `teal-700`, focus ring `teal-500`.
- **Dark**: primary `teal-400`, hover `teal-300`, focus ring `teal-400`.

### 1.2 Semantic tokens

A minimal `tokens.css`-style block declared inside `@theme` in `apps/web/src/styles.css`. Same token names in light and dark; the `.dark` class on `<html>` swaps the values.

| Token                     | Light value        | Dark value         | Purpose                                       |
| ------------------------- | ------------------ | ------------------ | --------------------------------------------- |
| `--color-primary`         | `teal-600`         | `teal-400`         | Primary CTA background, active tab, links     |
| `--color-primary-hover`   | `teal-700`         | `teal-300`         | Hover state of primary elements               |
| `--color-primary-fg`      | `white`            | `neutral-950`      | Foreground on primary background              |
| `--color-surface`         | `neutral-50`       | `neutral-950`      | Page background                               |
| `--color-surface-elevated`| `white`            | `neutral-900`      | Cards, drawer, alerts, elevated surfaces      |
| `--color-border`          | `neutral-200`      | `neutral-800`      | Container borders                             |
| `--color-border-strong`   | `neutral-300`      | `neutral-700`      | Interactive element borders (inputs, buttons) |
| `--color-fg`              | `neutral-900`      | `neutral-100`      | Primary text                                  |
| `--color-muted-fg`        | `neutral-500`      | `neutral-400`      | Secondary text, timestamps, type badges       |
| `--color-danger`          | `red-600`          | `red-500`          | Destructive actions, errors                   |
| `--color-danger-fg`       | `red-700`          | `red-300`          | Error message text                            |
| `--color-warning`         | `amber-500`        | `amber-400`        | "Unsaved changes" dirty state                 |
| `--color-ring`            | `teal-500`         | `teal-400`         | Focus ring colour                             |

Components consume these via Tailwind arbitrary values (`bg-[--color-surface-elevated]`, `text-[--color-fg]`, etc.) so a single class works in both themes.

### 1.3 Typography

Outfit (already wired). Five roles, applied consistently:

| Role      | Classes                                           | Where                                             |
| --------- | ------------------------------------------------- | ------------------------------------------------- |
| `display` | `text-3xl font-semibold`                          | Form title (editor + preview)                     |
| `heading` | `text-2xl font-semibold`                          | Page title ("Form builder" on home)               |
| `label`   | `text-base font-medium`                           | Field labels                                      |
| `body`    | `text-sm`                                         | Helper text, descriptions, error messages         |
| `micro`   | `text-xs uppercase tracking-wide text-muted-fg`   | Type badges, timestamps                           |

### 1.4 Radii, shadow, border

- **Interactive** (buttons, inputs, badges, drawer trigger): `rounded-md`.
- **Containers** (cards, alerts, drawer body, confirmation card): `rounded-lg`.
- **Pill bars** (segmented nav, undo/redo bar): `rounded-full`.
- **Shadow**: `shadow-sm` on every elevated surface (field cards, drawer, confirmation card). Nothing else casts shadow.
- **Border**: `--color-border` for containers, `--color-border-strong` for interactive elements.

### 1.5 Focus ring recipe

One recipe, applied to every interactive primitive:

```
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-offset-2
focus-visible:ring-offset-[--color-surface]
focus-visible:ring-[--color-ring]
```

---

## 2. Theme

- **Scope**: global browser-level preference; applies to every route including preview.
- **Persistence**: `localStorage` key `form-builder:theme` (values `light` | `dark` | `system`). Default is `system` on first visit, resolved via `prefers-color-scheme`.
- **Implementation**: `.dark` class toggled on `<html>` swaps CSS variable values in the `@theme` block.
- **Toggle**: `Sun` / `Moon` (Lucide) icon-button in the app header, right side. `aria-pressed` reflects the effective theme. `aria-label` switches between "Switch to dark theme" and "Switch to light theme".
- **Transition**: 200ms colour fade on theme swap.

---

## 3. Screen-level IA

### 3.1 App header (all routes)

Full-width, sticky top of viewport.

- **Left**: "Form builder" wordmark (`display`-style but `text-lg`), `router-link` to `/`.
- **Right**: `ThemeToggle`.
- Border-bottom `--color-border`, background `--color-surface-elevated`.

Removes the ad-hoc `h1` on home and the "← Back to forms" link on preview.

### 3.2 Editor page toolbar row

Rendered on both `/forms/:id` and `/forms/:id/preview`, sitting directly below the app header, above the canvas.

Row layout (left to right):

```
[ Editor | Preview ]  ...spacer...  [ Undo | Redo ]  [ + Field ]
      ▲                                    ▲              ▲
  Always shown                     Editor route only   Editor route only,
  (both routes)                                        <lg breakpoint only
```

- **Segmented nav** (`SegmentedNav`): rounded-full pill, two `<router-link>`s. Active tab has `bg-[--color-primary]` background with `text-[--color-primary-fg]`; `aria-current="page"`. Icons: `Pencil` (Editor), `Eye` (Preview). Text labels visible at `≥sm`, icon-only at `<sm`. Active-indicator slides 200ms on tab change.
- **Undo/Redo pill**: rounded-full container with two icon-buttons (`Undo2`, `Redo2`) separated by a subtle divider. Each is disabled when the history store has nothing to undo/redo.
- **+ Field drawer trigger**: `Plus` icon-button, opens the palette drawer. Only rendered on editor route, only at `<lg`.

### 3.3 Home / form list

- **Layout**: card grid.
  - `<md`: 1 column.
  - `md`: 2 columns.
  - `lg+`: 3 columns.
- **Card**: `rounded-lg` container with `--color-border`, `shadow-sm`, `--color-surface-elevated` background. Contents:
  - Title (`label` role, truncated to 2 lines).
  - Relative timestamp (`micro`).
  - Icon-button row: `Pencil` (Edit), `Eye` (Preview), `Copy` (Duplicate), `Trash2` (Delete). Each with `aria-label`.
- **Delete UX**: inline two-step confirm preserved (delete → confirm/cancel state on the same card).
- **Empty state**: single dashed-border card, centered copy, `Plus` primary button "+ New form".
- **Page action**: "+ New form" primary button in the top-right of the page content (below the app header, above the grid).

### 3.4 Editor

**Layout at `≥lg`**:

- Fixed left sidebar, ~240px wide, `--color-surface-elevated` background, `--color-border` right-border.
- Canvas fills remaining space, `max-w-3xl` centered within it, `space-y-6` sections.

**Layout at `<lg`**:

- Sidebar hidden; palette lives inside `Drawer` opened by the "+ Field" toolbar button.
- Canvas: full width with padding, `max-w-3xl` centered.

**Sidebar contents (field palette)**:

- Section 1 header: "Text elements" (`micro` style).
  - Button: `Type` icon + "Short answer".
  - Button: `AlignLeft` icon + "Paragraph".
- Section 2 header: "Multi elements" (`micro` style).
  - Button: `SquareCheck` icon + "Checkboxes".
  - Button: `CircleDot` icon + "Multiple choice".
  - Button: `SquareChevronDown` icon + "Dropdown".
- Each palette button is a `Button variant="ghost"` full-width, left-aligned, `label`-sized text. Clicking adds a field of that type to the canvas and auto-expands it (see §3.6).

**Canvas contents**:

1. Editor header (see §3.5).
2. Title/description block: inline-borderless `display`-sized title input + `body`-sized description textarea (2 rows). Border-bottom `--color-border`.
3. `FieldList` — the collapsible field cards (see §3.6).

The bottom-of-canvas field-type button grid is removed (moved into the sidebar/drawer).

### 3.5 Editor header (in-canvas)

Compact row, border-bottom `--color-border`.

- **Left**: save status. Icon + short label, no timer.
  - `Check` (teal) → "Saved".
  - `Loader2` spinning (neutral) → "Saving…".
  - `AlertCircle` (red) → "Failed — retry" + Retry button.
  - `Circle` (amber) → "Unsaved changes" (autosave off).
  - `Circle` (neutral) → "Not saved yet" (new, never persisted).
  - Container: `role="status" aria-live="polite"`. Icon swap animates 150ms.
- **Right**: `Autosave` toggle (native `<input type="checkbox">` with label).

Save button, undo, redo, preview link are all handled by the toolbar row (§3.2). This header holds only status + autosave preference.

### 3.6 Field card

**Two states**: collapsed (default on load) and expanded.

**Drag handle**:

- At `≥md`: rendered outside the card, on the left, using `GripVertical` (Lucide). Vertically centered against the card.
- At `<md`: rendered inside the card, top-left, in the header row.
- Same `@formkit/drag-and-drop` binding either way. Keyboard reorder (arrow keys with focused handle) works identically.

**Collapsed state**:

Whole card header is a `<button aria-expanded="false">`. Layout:

```
[type-icon]  Question label…                    [indicators] [Pencil] [Trash2]
```

- **Type icon**: matches the palette icon for the field's type.
- **Label**: `label` size, single line, truncated with ellipsis.
- **Indicators** (icon-only, no accompanying text; each has `aria-label`):
  - Helper description present → `Info` icon.
  - Choice field → `List` icon with a **small numeric badge** in the top-right corner showing option count.
  - Required → `Asterisk` icon, `text-[--color-danger]`.
- **Edit icon-button**: `Pencil`, expands the card. `@click.stop` (so it doesn't bubble to the outer button — though functionally identical here).
- **Delete icon-button**: `Trash2`, `variant="danger" variant-style="ghost"`. `@click.stop`.

The outer button handles Enter/Space to toggle expansion. Clicking anywhere else on the card also expands.

**Expanded state**:

Card is a `<div>` (not a button). Layout:

```
[type-icon] TYPE BADGE                       [Required ☐]  [Chevron up]

[label input — inline-borderless]

[description input — inline-borderless]

[type-specific body]

                                                       [Trash2]
```

- **Type icon + micro badge** (top-left): unchanged from collapsed.
- **Required toggle** (top-right): plain `<input type="checkbox">` with visible label "Required".
- **Collapse chevron** (right of Required): `ChevronUp` icon-button, closes the card. `aria-expanded="true"` on this button.
- **Label input**: `TextInput variant="inline-borderless"`, `label` size, placeholder "Question".
- **Description input**: `TextInput variant="inline-borderless"`, `body` size, placeholder "Helper text (optional)".
- **Type-specific body**:
  - **Text / paragraph**: `TextInput variant="inline-borderless"` single-line for the placeholder configuration. The paragraph respondent still gets `<textarea>` in preview.
  - **Checkbox / radio / select**: `FieldOptionList` + "+ Add option" `Button variant="ghost"`.
- **Delete icon-button** (bottom-right, `variant="danger"`, ghost style): removes the field.

**Expansion behaviour**:

- On load, all fields collapsed.
- Newly added fields open automatically.
- Multiple fields can be open simultaneously.
- Blur does **not** collapse.
- Only explicit collapse chevron or clicking the collapsed card toggles.
- Collapse/expand transitions `grid-template-rows` height over 200ms.

### 3.7 Preview

**Layout**: unchanged. `max-w-2xl` centered form column with `space-y-8` between fields.

**Toolbar**: same segmented nav from §3.2 (undo/redo and + Field are hidden on this route).

**Fields**: respondent-facing controls stay native HTML (`<input>`, `<textarea>`, `<select>`, `<input type="checkbox">`, `<input type="radio">`). Bordered variant, `rounded-md`, `--color-border-strong`. Focus ring per §1.5.

**Submit**: `Button variant="primary" size="md"` at bottom.

**Confirmation state** (post-submit):

- `Card` with `shadow-sm`, `rounded-lg`, `max-w-md`, centered.
- Contents (centered, `space-y-4`):
  - `PartyPopper` icon, `text-[--color-primary]`, size ~64px.
  - Heading (`heading` role): "Response recorded".
  - Body (`body` role, `text-muted-fg`): "This is a preview — no data was actually submitted."
  - Primary `Button`: "Submit another response".
  - Secondary link: "← Back to forms" (plain link, `text-[--color-primary]`, hover underline).

**Error / loading / not-found states**: use `Alert` primitive with the same look as today.

---

## 4. Component primitives

New folder: `apps/web/src/components/ui/`. Each primitive is a hand-rolled Vue SFC using the token classes above.

| Component        | Notes                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `Button.vue`     | Variants: `primary`, `secondary`, `ghost`, `danger`. Sizes: `sm` (h-8), `md` (h-10). Props: `iconOnly` (boolean, requires `aria-label`), `disabled`, `loading` (shows `Loader2` spinner, disables). Single component covers text buttons and icon buttons. |
| `TextInput.vue`  | Variants: `bordered` (default, `--color-border-strong` border), `inline-borderless` (transparent, only visible on hover/focus). Uses `--color-ring` focus ring. |
| `Textarea.vue`   | Same variant set as `TextInput`.                                                                        |
| `Card.vue`       | `rounded-lg` container with `--color-border` border, `--color-surface-elevated` background, `shadow-sm`. Slot-only. |
| `Alert.vue`      | Variants: `info`, `warning`, `danger`, `success`. `role="alert"` on non-`info`.                         |
| `Badge.vue`      | Small `rounded-md` label. Variants: `neutral`, `primary`, `danger`. Used for the type badge and the option-count badge. |
| `SegmentedNav.vue` | Rounded-full pill container with N `<router-link>` items. Active item styled with `--color-primary`. Sliding indicator on active change. Icons + optional labels. |
| `Drawer.vue`     | Fixed `<aside>` slide-in from left. Scrim `<div>` behind. Focus trap. Closes on Escape and scrim click. Restores focus to the trigger. 200ms transform + fade. |
| `ThemeToggle.vue`| Icon-button. Toggles `.dark` on `<html>`. `aria-pressed`, dynamic `aria-label`.                         |

---

## 5. Motion

150–200ms transitions on:

- Theme swap: colour fade.
- Drawer: slide-in transform + scrim fade.
- Field-card collapse/expand: `grid-template-rows` height.
- Segmented-tab active-indicator: slide.
- Autosave-status icon swap: cross-fade.

No list-reorder animation on DnD (out of scope).

---

## 6. Accessibility invariants (feed ticket 11)

- One focus-ring recipe, applied to every interactive primitive.
- Every icon-only button has a required `aria-label` (enforce via `Button.vue` prop validation).
- `SegmentedNav` uses `<router-link>`s; the active link carries `aria-current="page"`.
- `Drawer` traps focus, restores focus on close, closes on Escape and scrim click.
- Field card collapse toggle: `aria-expanded` on the header button; `aria-controls` pointing to the expanded body.
- Theme toggle: `aria-pressed` + dynamic label.
- Autosave status: `role="status" aria-live="polite"` on the container.
- Radio and checkbox groups in preview wrapped in `<fieldset>` + `<legend>` derived from the field label.
- Helper descriptions linked to their input via `aria-describedby`.
- Validation errors: `role="alert"` + linked to input via `aria-describedby`.
- Colour contrast: verified for `teal-600` on `--color-surface-elevated` (light) and `teal-400` on `neutral-900` (dark) — both must clear WCAG AA for regular text.

---

## 7. Responsive invariants (feed ticket 14)

- Editor sidebar → `Drawer` at `<lg`.
- Field card drag handle moves inside the card at `<md`.
- Home list card grid: 1 col `<md`, 2 cols `md`, 3 cols `lg`.
- Segmented nav: text labels drop at `<sm`, icons remain.
- All icon-buttons: 44px minimum tap target on touch (outer `size-11`, icon `size-5` centered).
- Editor canvas centered in remaining space at `≥lg` (not left-aligned against sidebar).
- No horizontal scroll at 360px on any route.
