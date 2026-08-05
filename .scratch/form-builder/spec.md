# Form Builder — Spec

Status: ready-for-agent

## Problem Statement

A form creator needs to design forms — questions of several types, some required, some optional, some presenting predefined choices — without writing code. They need to iterate freely (add, remove, reorder, rename), never lose work to a mistake or a browser refresh, and see exactly what a respondent will experience before publishing. A respondent needs to fill the form in and be told clearly and immediately when their input is incomplete or invalid, one field at a time, without the app losing track of what they have already entered.

## Solution

A dynamic form-builder web application with three surfaces: a list of saved `FormTemplate`s, an editor for a single template, and a preview that lets a respondent fill in a `FormResponse` and simulate submission. The editor supports the five required field types (`text`, `paragraph`, `checkbox`, `radio`, `select`) as a discriminated union, undo/redo over a whole-snapshot history stack with keyboard shortcuts, drag-and-drop reordering with a keyboard-accessible alternative, and autosave to a Hono + SQLite backend with a user-controllable toggle. The preview validates on submit and re-validates on blur once the respondent has attempted a submission, associates each error inline with its field, and scrolls the first invalid field into view. Conditional visibility lets a field appear only when another field's answer matches a rule; hidden fields clear their answer and are excluded from validation. Persistence is real (the backend stores templates); "submission" in the preview is simulated client-side only.

## User Stories

### Form editor — header

1. As a form creator, I want a new form to start with a default title `Untitled Form`, so that I can begin editing immediately without a naming step.
2. As a form creator, I want to edit the form title inline, so that I can name a form as it takes shape.
3. As a form creator, I want to edit the form description inline, so that respondents understand the purpose of the form.
4. As a form creator, I want the current save state visible in the header (`Saved • Ns ago` / `Saving…` / `Failed — retry`), so that I always know whether my work is safe.
5. As a form creator, I want to see a clear "New form — not saved yet" indicator before the first save, so that I know a template exists only in my browser until I save.

### Form editor — fields

6. As a form creator, I want to add a `text` field, so that I can ask for single-line free-text answers.
7. As a form creator, I want to add a `paragraph` field, so that I can ask for multi-line free-text answers.
8. As a form creator, I want to add a `checkbox` field with editable options, so that I can ask questions where multiple answers can be selected.
9. As a form creator, I want to add a `radio` field with editable options, so that I can ask questions where exactly one visible answer can be selected.
10. As a form creator, I want to add a `select` field with editable options, so that I can ask questions where exactly one answer is chosen from a collapsed dropdown.
11. As a form creator, I want to edit a field's label, so that I can phrase the prompt however I need.
12. As a form creator, I want to edit a field's helper description, so that I can clarify a prompt without cluttering the label.
13. As a form creator, I want to mark a field as required, so that respondents cannot skip it.
14. As a form creator, I want to delete a field, so that I can remove questions I no longer need.
15. As a form creator, I want to add, edit, remove, and reorder `FieldOption`s inside `checkbox`, `radio`, and `select` fields, so that the choices reflect what respondents should see.
16. As a form creator, I want a `text` or `paragraph` field to expose a placeholder, so that I can hint at the expected answer format.
17. As a form creator, I want to reorder fields with drag-and-drop, so that I can adjust the flow of the form intuitively.
18. As a form creator, I want to reorder fields with the keyboard alone, so that I can build a form without a pointing device.

### Form editor — undo/redo

19. As a form creator, I want to undo any change to the form, so that I can recover from mistakes without redoing my work from scratch.
20. As a form creator, I want to redo an undone change, so that I can restore work I undid by accident.
21. As a form creator, I want undo/redo to work with `Cmd+Z` / `Ctrl+Z` and `Cmd+Shift+Z` / `Ctrl+Shift+Z`, so that the app matches the shortcuts I already know.
22. As a form creator, I want a typing pause or blur to commit a single history step for a label edit, so that undo does not walk through every keystroke.
23. As a form creator, I want a drag that ends where it started to not create a history step, so that undo is not polluted by no-op interactions.

### Form editor — persistence and autosave

24. As a form creator, I want the editor to autosave my changes in the background, so that I never have to think about saving.
25. As a form creator, I want to turn autosave off globally, so that I can control exactly when my work is written to the server.
26. As a form creator with autosave off, I want an explicit Save button, so that I can commit my work when I choose.
27. As a form creator, I want `Cmd+S` / `Ctrl+S` to save immediately (flushing any pending autosave), so that I can force a save without hunting for a button.
28. As a form creator, I want the browser to warn me before I close a tab with unsaved changes, so that I do not lose work by accident.
29. As a form creator, I want an in-app confirmation before I navigate away from a dirty editor, so that a mis-clicked link does not lose my work.
30. As a form creator, I want a failed save to keep my changes locally and offer a manual retry, so that a flaky network does not cost me work.

### Form list & duplication

31. As a form creator, I want a page listing all my saved forms with title and last-updated time, so that I can pick up where I left off.
32. As a form creator, I want to open a form from the list into the editor, so that I can continue working on it.
33. As a form creator, I want to open a form's preview from the list, so that I can share or review it without editing.
34. As a form creator, I want to duplicate a form from the list, so that I can start a new form from an existing template without rebuilding it.
35. As a form creator, I want to delete a form from the list, so that I can remove templates I no longer need.

### Preview — respondent experience

36. As a respondent, I want to see the form title and description at the top of the preview, so that I understand what I am filling in.
37. As a respondent, I want each field's label and helper description shown clearly, so that I know what is being asked and why.
38. As a respondent, I want required fields visually marked, so that I know which questions I must answer before submitting.
39. As a respondent, I want functional controls for all five field types, so that I can submit any kind of answer the form asks for.
40. As a respondent, I want to submit the form, so that I can complete the task the creator designed.
41. As a respondent, I want submission blocked when a required visible field is empty, so that I cannot accidentally submit an incomplete form.
42. As a respondent, I want each validation error shown inline under its field, so that I know exactly what to fix.
43. As a respondent, I want the first invalid field scrolled into view and focused on a failed submit, so that I can start fixing errors immediately.
44. As a respondent, I want errors to appear on submit and thereafter to update as I blur each field, so that I get feedback at the moment it is useful without being nagged as I type.
45. As a respondent, I want a clear confirmation after a successful submission, so that I know the form was accepted.

### Conditional visibility

46. As a form creator, I want to make a field visible only when another field's answer matches a rule, so that I can build branching forms without duplicating templates.
47. As a form creator, I want to base visibility rules on equality for `radio` and `select` answers, and "includes option X" for `checkbox` answers, so that the trigger matches how the source field is answered.
48. As a form creator, I want cascading visibility rules (a hidden field can itself gate other fields), so that I can build multi-step conditional forms.
49. As a form creator, I want the app to refuse to save a template with cyclic visibility rules, so that the preview cannot enter an unstable state.
50. As a respondent, I want a hidden field to clear its answer so that re-showing it does not surface a stale value from an earlier session.
51. As a respondent, I want hidden fields excluded from validation, so that I am never blocked by a required field I cannot see.

### Accessibility

52. As a keyboard-only user, I want to operate the entire editor with the keyboard, including field reordering, so that I do not need a mouse.
53. As a screen-reader user, I want each input to have its label properly associated, so that my assistive tech announces what I am editing.
54. As a screen-reader user, I want radio and checkbox groups wrapped in semantic fieldsets with legends, so that their group meaning is announced.
55. As a screen-reader user, I want validation errors announced when they appear, so that I hear feedback without reading the screen.
56. As a keyboard-only user, I want visible focus states on every interactive element, so that I always know where I am.

### Responsive

57. As a form creator on a smaller screen, I want the editor to remain usable, so that I can make quick edits on any device.
58. As a respondent on any device, I want the preview to lay out cleanly, so that I can fill the form without pinching or scrolling horizontally.

## Implementation Decisions

**Modules & layout.** pnpm monorepo. `apps/web` (Vue 3, Composition API `<script setup>`, TypeScript strict, Pinia, Vite, Tailwind v4, Outfit font). `apps/api` (Hono, better-sqlite3). `packages/shared` (the Zod schemas and TypeScript types for `FormTemplate`, `Field`, `FieldOption`, `FormResponse`, `Answer`, and `VisibilityRule`). See ADR-0001.

**Storage.** SQLite `form_templates` table with columns `id TEXT PRIMARY KEY`, `title TEXT`, `description TEXT`, `body JSON`, `created_at INTEGER`, `updated_at INTEGER`. The `body` column holds the ordered array of `Field`s with their nested `FieldOption`s. See ADR-0002.

**API surface.** Five routes on `apps/api`:
- `GET /templates` — list metadata (id, title, updated_at), no body.
- `GET /templates/:id` — full template including body.
- `POST /templates` — accepts a body with a client-generated `id`; returns 409 on duplicate primary key.
- `PUT /templates/:id` — replaces the whole template; idempotent.
- `DELETE /templates/:id`.
Duplication is a client-side clone + POST. No submissions endpoint.

**ID generation.** `crypto.randomUUID()` for every `FormTemplate`, `Field`, and `FieldOption` at the moment of client-side creation. Unified `id: string` everywhere. Server accepts client-assigned IDs on POST. See ADR-0004.

**Field-type discriminated union.** The type surface `packages/shared` exports:

```ts
type FieldId = string;
type OptionId = string;

interface BaseField {
  id: FieldId;
  label: string;
  description?: string;
  required: boolean;
  visibility?: VisibilityRule;
}

interface TextField      extends BaseField { type: 'text';      placeholder?: string }
interface ParagraphField extends BaseField { type: 'paragraph'; placeholder?: string }

interface FieldOption { id: OptionId; label: string }

interface CheckboxField extends BaseField { type: 'checkbox'; options: FieldOption[] }
interface RadioField    extends BaseField { type: 'radio';    options: FieldOption[] }
interface SelectField   extends BaseField { type: 'select';   options: FieldOption[] }

type Field = TextField | ParagraphField | CheckboxField | RadioField | SelectField;

interface FormTemplate {
  id: string;
  title: string;
  description: string;
  fields: Field[];
  createdAt: number;
  updatedAt: number;
}
```

`VisibilityRule` references a source `FieldId` and encodes either `equals: OptionId` (for radio/select) or `includes: OptionId` (for checkbox).

**Validation.** Zod schemas mirror the types above, live in `packages/shared`, and are used server-side at the API boundary and client-side both at the store boundary and to validate `FormResponse` on submit. See ADR-0006.

**Undo/redo model.** Whole-`FormTemplate` snapshots on every committed action, pushed onto a bounded history stack (cap around 100 steps). Steps are committed on: field add, field delete, field reorder (skipped if it ends where it started), field-setting toggle, option add/edit/delete/reorder, and after a 500 ms typing pause or blur on label/description/option-label inputs. Autosave never creates a history step. See ADR-0003.

**Editor store state (Pinia).** Owns the current `FormTemplate`, the undo/redo stacks, and two orthogonal flags: `isPersisted` (has it ever been saved) and `isDirty` (does the in-memory template differ from the last successful save). Autosave triggers on `isDirty` transitions with a debounce; the exact debounce interval is a user-tunable defaulting to something reasonable (starting suggestion: 800 ms, subject to change).

**Autosave semantics.** Debounced PUT of the whole template on any committed mutation. New forms POST first, then subsequent saves PUT. Failure keeps the change in memory, marks the form dirty, and surfaces a retry action. A global toggle in `localStorage` disables autosave; when disabled, an explicit Save button and `Cmd+S` / `Ctrl+S` are the only save affordances. Even with autosave on, the Save button and shortcut work as "force-flush pending debounce." A `beforeunload` warning and a vue-router route-leave guard both fire only when `isDirty`.

**Preview state.** A separate Pinia store owns the `FormResponse` in preview mode. It tracks per-field touched state, evaluates conditional visibility as a fixed point on every relevant answer change, clears hidden fields' answers when they become hidden, and validates the response on submit-attempt (and thereafter on blur per-field). See ADR-0005.

**Routing.** `vue-router` with three routes: `/` (list), `/forms/:id/edit`, `/forms/:id/preview`. Each route mounts a route-scoped Pinia store or hydrates the editor/preview store from the URL.

**Drag-and-drop.** `@formkit/drag-and-drop` for field and option reordering, chosen for its built-in keyboard-accessibility story. Reorders that end where they started are dropped without a history step.

**Validation UX.** Errors are hidden on first render; on submit-attempt, all errors show inline under their fields, the first invalid field is scrolled to and focused. From that point on, each field re-validates on blur. Error nodes carry `role="alert"` and are linked to their input via `aria-describedby`. The message is generic ("This field is required").

**Conditional visibility engine.** Rules are evaluated as a fixed point until stable. Save-time cycle detection refuses to persist a template with a rule graph that does not converge. Hidden fields are removed from the DOM (not merely hidden with CSS), their answer is cleared from the `FormResponse`, and they are excluded from validation. See ADR-0005.

**Duplication.** Client-side: deep-clone the fetched template, regenerate all IDs (`FormTemplate`, `Field`, `FieldOption`), suffix the title (`" (copy)"`), POST as a new template.

**Styling.** Tailwind v4, Outfit font loaded once, a small `tokens.css` for semantic color variables. Responsive is a base requirement, not an optional extra.

## Testing Decisions

**What makes a good test.** External behavior only: given a starting state and a user-observable action, assert the user-observable outcome. Do not assert on which functions were called, which components re-rendered, or the shape of internal store state beyond what the UI or API reflects. A test that would still pass after a legitimate refactor of the internals is the goal.

**Seam 1 — Vitest (unit / pure-logic).** Everything that is a pure function of state, run in Node, in milliseconds. Owned by `packages/shared` and the pure reducers/selectors in the Pinia stores:

- The undo/redo history stack: push, undo, redo, cap, no-op-drag exclusion, typing-pause coalescing, autosave-does-not-push.
- Template mutations: add/delete/reorder field of each type, toggle `required`, edit label/description/placeholder, add/edit/delete/reorder options.
- `FormResponse` validation: required-and-visible-and-empty is invalid, option-membership is enforced, hidden fields never contribute errors.
- The visibility fixed-point evaluator: single rule, cascading rules, cycle detection at save time.
- The Zod schemas: round-trip parse/stringify of representative templates including all five field variants and visibility rules.

**Seam 2 — Playwright (end-to-end).** A small pyramid of high-value flows, each covering multiple user stories at once:

- Create a form, add one of each field type, edit labels and options, refresh, verify persistence.
- Autosave off: make a change, verify no network activity, hit `Cmd+S`, verify save; navigate away with dirty state, verify guards fire.
- Preview: submit an empty required form, verify inline error and focus on the first invalid field; fix and re-submit, verify success.
- Undo/redo: perform a sequence of mutations, undo them all, redo them all, verify the final state matches the pre-undo state.
- Keyboard-only field reorder: focus a field, use the DnD library's keyboard affordance, verify order changes and history reflects one step.
- Conditional visibility: set a rule, verify the target field shows/hides, verify its answer clears when hidden, verify validation ignores it while hidden.

**Seam 3 — API.** No dedicated integration suite. Zod schemas are covered in Seam 1; the HTTP wiring is covered end-to-end by Seam 2 (Playwright runs against the real Hono server).

**Prior art.** None — this is a greenfield repo. The two seams above are the prior art for anything added later.

## Out of Scope

- Real submissions. Preview submission is client-side simulation only.
- Authentication, multi-tenancy, per-user forms. The app is single-user, and this constraint is called out in ADR-0004 as a reason client-generated IDs are safe here.
- Server-side rendering, i18n, dark mode. Not asked for; each carries real cost.
- Persistence of `FormResponse` (submitted answers). The backend stores `FormTemplate`s only.
- Cross-template queries or reporting. The hybrid SQLite schema (ADR-0002) does not support them; the trade-off is recorded.
- Additional field types beyond the five listed (date, file upload, numeric ranges, etc.). The discriminated union is designed to accept new variants later without disturbing existing ones.
- Text-field-value triggers for conditional visibility. Only radio/select equality and checkbox "includes" are supported.
- Vue component unit tests. The seams above cover the same behavior at higher signal.
- A dedicated API integration test suite. Covered end-to-end by Playwright.

## Further Notes

**Where the risk sits.** The two highest-risk areas are (a) undo/redo interacting cleanly with autosave and dirty tracking, and (b) conditional visibility interacting cleanly with validation and with clearing answers. Both are covered by Vitest at the pure-logic layer and by Playwright at the flow layer.

**Where the cut is if time runs out.** Conditional visibility (§ user stories 46–51 and its ADR-0005) is the deliberate cut point. The rest of the extras (a11y, Playwright, autosave, duplication, responsive) tell a coherent senior story about correctness and craftsmanship; conditional visibility tells a different "look, another feature" story and is the only extra whose semantics the spec itself flagged as an open question the implementer must answer. If it ships, ship it fully — half-implemented conditional logic is worse than none.

**Vocabulary.** All code, tests, commit messages, and PR descriptions should use the terms defined in `CONTEXT.md` (`FormTemplate`, `Field`, `FieldOption`, `FormResponse`, `Answer`, `Respondent`, `HistoryStep`, `isPersisted`, `isDirty`, `Autosave`, `VisibilityRule`) and avoid the `_Avoid_` synonyms.

**ADRs applied.** 0001 (monorepo), 0002 (SQLite hybrid), 0003 (whole-snapshot undo/redo), 0004 (client-generated UUIDs), 0005 (hidden = cleared), 0006 (shared Zod).
