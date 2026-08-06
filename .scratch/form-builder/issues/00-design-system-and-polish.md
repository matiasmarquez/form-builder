# 00 — Design system and polish

**What to build:** the frozen visual language and screen-level IA described in [`design.md`](../design.md). Establishes `tokens.css`, dark theme, Lucide icons, extracted UI primitives, the app header, the editor toolbar row (segmented nav + undo/redo pill + drawer trigger), the field palette sidebar/drawer, collapsible field cards, the card-grid home, and the redesigned preview confirmation state. Everything else in the polish pass (a11y sweep and responsive sweep) targets this baseline.

**Blocked by:** None — every functional prerequisite (04, 05, 09, 10) is already done.

**Blocks:** 11 (accessibility polish sweep), 14 (responsive polish sweep).

**Status:** ready-for-human

## Tokens and theme

- [x] `apps/web/src/styles.css` extended with the semantic token block from [`design.md` §1.2](../design.md#12-semantic-tokens), declared inside `@theme` (light values) and overridden inside a `.dark` block
- [x] Body base classes updated to consume `--color-surface` and `--color-fg` instead of `bg-neutral-50 text-neutral-900`
- [x] `useTheme` composable added under `apps/web/src/composables/useTheme.ts` that reads/writes `localStorage['form-builder:theme']` (values `light` | `dark` | `system`), resolves `system` via `prefers-color-scheme`, and toggles `.dark` on `<html>`
- [x] Theme applied on app boot before first paint (no flash of wrong theme)
- [x] 200ms colour transition on theme swap

## Icon library

- [x] `lucide-vue-next` added to `apps/web/package.json`
- [x] Icons used across the app, imported per icon to keep the bundle small: `Type`, `AlignLeft`, `SquareCheck`, `CircleDot`, `SquareChevronDown`, `Pencil`, `Eye`, `Trash2`, `Copy`, `Plus`, `Undo2`, `Redo2`, `Sun`, `Moon`, `Check`, `Loader2`, `AlertCircle`, `Circle`, `GripVertical`, `Info`, `List`, `Asterisk`, `ChevronUp`, `PartyPopper`

## Component primitives (`apps/web/src/components/ui/`)

- [x] `Button.vue` — variants `primary` / `secondary` / `ghost` / `danger`, sizes `sm` / `md`, `iconOnly` prop that enforces a non-empty `aria-label`, `loading` state renders `Loader2` and disables the button
- [x] `TextInput.vue` — variants `bordered` / `inline-borderless`, focus ring per [`design.md` §1.5](../design.md#15-focus-ring-recipe)
- [x] `Textarea.vue` — same variants as `TextInput`
- [x] `Card.vue` — `rounded-lg`, `--color-border`, `--color-surface-elevated`, `shadow-sm`, slot-only
- [x] `Alert.vue` — variants `info` / `warning` / `danger` / `success`, `role="alert"` on non-`info`
- [x] `Badge.vue` — variants `neutral` / `primary` / `danger`
- [x] `SegmentedNav.vue` — rounded-full pill, N `<router-link>` items, active carries `aria-current="page"`, sliding indicator animates 200ms
- [x] `Drawer.vue` — slide-in from the left, scrim behind, focus trap, closes on Escape and scrim click, restores focus to the trigger, 200ms transform + fade
- [x] `ThemeToggle.vue` — `Sun` / `Moon`, `aria-pressed` reflects effective theme, `aria-label` switches between "Switch to dark theme" and "Switch to light theme"

## App header

- [x] New `AppHeader.vue` rendered by `App.vue` on every route
- [x] Left: "Form builder" wordmark as `<router-link to="/">`
- [x] Right: `ThemeToggle`
- [x] Border-bottom `--color-border`, background `--color-surface-elevated`, sticky top
- [x] Ad-hoc `h1` on `HomeView` and "← Back to forms" on `PreviewView` removed

## Editor toolbar row

- [x] New `EditorToolbar.vue` rendered by both `EditorView` and `PreviewView` directly under the app header
- [x] `SegmentedNav` with Editor (`Pencil`) and Preview (`Eye`) items linking to `/forms/:id` and `/forms/:id/preview`; text labels visible at `≥sm`, icon-only at `<sm`
- [x] Undo/Redo pill (`Undo2`, `Redo2` inside a `rounded-full border` container with a subtle divider) rendered only on the editor route; each icon-button disabled when the history store has nothing to undo/redo
- [x] "+ Field" drawer trigger (`Plus`) rendered only on the editor route and only at `<lg`; opens the palette `Drawer`

## Editor layout and palette

- [x] `EditorView` refactored to a two-column layout at `≥lg`: fixed ~240px left sidebar + centered `max-w-3xl` canvas in remaining space
- [x] At `<lg`, sidebar hidden and its content mounted inside the palette `Drawer`
- [x] New `FieldPalette.vue` contains two `micro`-headed groups (`Text elements`, `Multi elements`) with one `Button variant="ghost"` per field type, each with the type icon on the left
- [x] Clicking a palette button adds a field of that type to the canvas and auto-expands it
- [x] The existing bottom-of-canvas field-type button grid in `EditorView` removed

## Editor header (in-canvas)

- [x] `EditorHeader.vue` simplified: left side is save status (icon + short label, **no timer**), right side is the Autosave toggle only
- [x] Save button **kept** in this header (agreed deviation from the design doc during implementation)
- [x] Status icon set per [`design.md` §3.5](../design.md#35-editor-header-in-canvas), swap animates 150ms
- [x] `role="status" aria-live="polite"` preserved on the status container

## Collapsible field card

- [x] `FieldList` field card refactored to a collapsed/expanded pair as described in [`design.md` §3.6](../design.md#36-field-card)
- [x] On load, all fields render collapsed
- [x] Newly added fields render expanded
- [x] Multiple fields can be expanded simultaneously; blur does not collapse
- [x] Collapsed header is a `<button aria-expanded>` with `aria-controls` pointing to the expanded body
- [x] Collapsed layout: type icon, label (truncated), indicator icons (`Info` if description present, `List` with numeric option-count badge for choice fields, `Asterisk` in danger colour if required), `Pencil` edit button, `Trash2` delete button
- [x] Expanded layout: type icon + `micro` type badge, `Required` plain `<input type="checkbox">` top-right, `ChevronUp` collapse button, inline-borderless label input, inline-borderless description input, type-specific body (single-line placeholder input for text/paragraph; `FieldOptionList` + "+ Add option" for choice fields), delete `IconButton` (danger, ghost) bottom-right
- [x] Paragraph field's placeholder configuration input is single-line (respondent still sees `<textarea>` in preview)
- [x] Drag handle (`GripVertical`) rendered outside the card, left side, at `≥md`; moves inside the card header at `<md`; same DnD binding either way
- [x] Collapse/expand transitions `grid-template-rows` height over 200ms

## Home / form list

- [x] `HomeView` refactored from row list to card grid (1 col `<md`, 2 cols `md`, 3 cols `lg`)
- [x] Each card uses the `Card` primitive; shows title (truncated), relative timestamp (`micro`), and an icon-button row (`Pencil`, `Eye`, `Copy`, `Trash2`), each with `aria-label`
- [x] Inline two-step delete confirm preserved
- [x] Empty state remains a dashed-border card with centered copy and a single "+ New form" primary button
- [x] Top-of-page "+ New form" primary button preserved, positioned above the grid

## Preview

- [x] `PreviewView` continues to render fields with native HTML controls; classes updated to consume the tokens (`--color-border-strong` for input border, focus ring per §1.5)
- [x] Confirmation state redesigned per [`design.md` §3.7](../design.md#37-preview): `Card`, `max-w-md`, centered, `PartyPopper` icon in `--color-primary` at ~64px, heading "Response recorded", body copy "This is a preview — no data was actually submitted.", primary "Submit another response" button, secondary "← Back to forms" link
- [x] Error / loading / not-found states migrated to the `Alert` primitive

## Comments

- 2026-08-06: Implemented. Save button retained in `EditorHeader` by explicit agreement (deviation from design.md §3.5 / issue checklist item that removed it).
