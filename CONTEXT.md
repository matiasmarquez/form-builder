# Form Builder

A dynamic form-builder application (Google-Forms-style) with a Vue 3 editor, a preview mode for respondents, and a Hono + SQLite backend that persists form templates.

## Language

### Design-time (the form as it is being built)

**FormTemplate**:
The designed shape of a form — its title, description, and ordered list of fields. This is the persisted entity. Never contains respondent data.
_Avoid_: Form, FormDefinition, FormSchema

**Field**:
A single question inside a `FormTemplate`. A discriminated union keyed on `type`; the concrete variants are `TextField`, `ParagraphField`, `CheckboxField`, `RadioField`, and `SelectField`.
_Avoid_: Question, Item, Input, Control

**FieldOption**:
A single selectable choice inside a `CheckboxField`, `RadioField`, or `SelectField`. Has a stable `id` so that reorder or relabel does not confuse historical answers.
_Avoid_: Choice, Value, Item

**BaseField**:
The properties shared by every `Field` variant — `id`, `label`, `description` (helper text), and `required`. Not a runtime type; only a TypeScript interface that the variants extend.

### Runtime (the form as it is being filled in)

**FormResponse**:
The object that holds a respondent's answers while filling out a form in preview mode, and — on successful submit — the immutable record of what they submitted. Not persisted; preview is client-only.
_Avoid_: FormSubmission, FormAnswers, FormDraft

**Answer**:
A single field's value inside a `FormResponse`. Its shape depends on the field type (string for `text`/`paragraph`, `OptionId` for `radio`/`select`, `OptionId[]` for `checkbox`).
_Avoid_: Value, Input, Entry

**Respondent**:
The person filling out a form in preview mode. Never a persisted concept — used only in prose and a11y labels.
_Avoid_: User, Filler, Submitter

### Editor state

**HistoryStep**:
One entry in the undo/redo stack. Contains a full snapshot of the `FormTemplate` at the moment the step was committed. A step is committed on: field add, field delete, field reorder (unless it ends where it started), field setting toggle, and after a label/description typing pause (500ms) or blur.
_Avoid_: Action, Command, Change, Edit

**isPersisted**:
Editor store flag — has this `FormTemplate` ever been successfully saved to the server? Starts `false` on a new form, flips to `true` on the first successful POST, never goes back.

**isDirty**:
Editor store flag — does the in-memory `FormTemplate` differ from the last version successfully saved to the server? Independent of `isPersisted`.

**Autosave**:
Debounced background persistence of the current `FormTemplate` to the server. Emits status transitions the header renders: `Saved • Ns ago` / `Saving…` / `Failed — retry`. User-controllable via a global toggle in `localStorage`. Never creates a `HistoryStep`.
_Avoid_: Sync, Persist

### Conditional visibility (optional feature)

**VisibilityRule**:
A rule attached to a `Field` that makes it visible only when another field's answer matches a condition. Triggers are equality on `RadioField`/`SelectField` answers and "includes" on `CheckboxField` answers.
_Avoid_: Condition, Dependency, Trigger

**Hidden field**:
A `Field` whose `VisibilityRule` currently evaluates to false. Its `Answer` is cleared while hidden, and it is excluded from validation on submit. Rules may cascade; cycles are rejected at save time.
