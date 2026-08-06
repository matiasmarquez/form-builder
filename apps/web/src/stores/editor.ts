import { defineStore } from 'pinia';
import type {
  CheckboxField,
  Field,
  FieldId,
  FieldOption,
  FormTemplate,
  OptionId,
  ParagraphField,
  RadioField,
  SelectField,
  TextField,
} from '@form-builder/shared';

// Field variants that carry an `options: FieldOption[]` array. Kept as a
// TS-only alias so the runtime discriminated union stays authoritative in
// `@form-builder/shared`.
type ChoiceField = CheckboxField | RadioField | SelectField;

export const HISTORY_CAP = 100;
export const COALESCE_MS = 500;

// Debounce window for autosave. Single named constant so it's easy to tune;
// starting value chosen to feel responsive without spamming the API mid-word.
export const AUTOSAVE_DEBOUNCE_MS = 800;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

// Injected save transport. The store doesn't import `fetch` directly so
// tests can substitute a fake and so the wiring lives in `main.ts`.
export interface TemplateSaveTransport {
  create(template: FormTemplate): Promise<void>;
  update(template: FormTemplate): Promise<void>;
}

let saveTransport: TemplateSaveTransport | null = null;

export function setTemplateSaveTransport(transport: TemplateSaveTransport | null): void {
  saveTransport = transport;
}

export function createEmptyTemplate(id: string, now: number = Date.now()): FormTemplate {
  return {
    id,
    title: 'Untitled Form',
    description: '',
    fields: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createTextField(id: string): TextField {
  return {
    id,
    type: 'text',
    label: '',
    description: '',
    required: false,
    placeholder: '',
  };
}

export function createParagraphField(id: string): ParagraphField {
  return {
    id,
    type: 'paragraph',
    label: '',
    description: '',
    required: false,
    placeholder: '',
  };
}

export function createCheckboxField(id: string, optionId: string): CheckboxField {
  return {
    id,
    type: 'checkbox',
    label: '',
    description: '',
    required: false,
    options: [{ id: optionId, label: '' }],
  };
}

export function createRadioField(id: string, optionId: string): RadioField {
  return {
    id,
    type: 'radio',
    label: '',
    description: '',
    required: false,
    options: [{ id: optionId, label: '' }],
  };
}

export function createSelectField(id: string, optionId: string): SelectField {
  return {
    id,
    type: 'select',
    label: '',
    description: '',
    required: false,
    options: [{ id: optionId, label: '' }],
  };
}

export function isChoiceField(field: Field): field is ChoiceField {
  return field.type === 'checkbox' || field.type === 'radio' || field.type === 'select';
}

// One entry in the undo/redo stack — a full snapshot of the FormTemplate at
// the moment the step was committed (ADR-0003).
export interface HistoryStep {
  snapshot: FormTemplate;
}

interface EditorState {
  template: FormTemplate | null;
  undoStack: HistoryStep[];
  redoStack: HistoryStep[];
  // When set, the next mutation on this key is treated as continuing the
  // in-flight coalesced step (no new HistoryStep pushed). Cleared by
  // flushCoalesce(), by a 500 ms typing pause, or by any mutation with a
  // different key (discrete mutations use `null`).
  coalesceKey: string | null;
  // Has this template ever been successfully saved to the server?
  isPersisted: boolean;
  // Does the in-memory template differ from the last successful save?
  isDirty: boolean;
  // Monotonic counter bumped on every user mutation (including inside a
  // coalesce window). Consumers that want a true "restart on every keystroke"
  // debounce — like autosave — watch this instead of `isDirty`, which only
  // toggles false→true once and would otherwise miss subsequent keystrokes.
  revision: number;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  lastSaveError: string | null;
}

// The pending pause timer is kept off the reactive store state — it's a raw
// browser handle, not part of the FormTemplate history model.
let coalesceTimer: ReturnType<typeof setTimeout> | null = null;

function cloneTemplate(template: FormTemplate): FormTemplate {
  // A FormTemplate is plain JSON (strings, numbers, arrays, objects), so
  // JSON round-trip is both a true deep copy AND unwraps Vue's reactive
  // proxies — structuredClone chokes on the proxy handles.
  return JSON.parse(JSON.stringify(template)) as FormTemplate;
}

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => ({
    template: null,
    undoStack: [],
    redoStack: [],
    coalesceKey: null,
    isPersisted: false,
    isDirty: false,
    revision: 0,
    saveStatus: 'idle',
    lastSavedAt: null,
    lastSaveError: null,
  }),
  getters: {
    canUndo: (state) => state.undoStack.length > 0,
    canRedo: (state) => state.redoStack.length > 0,
    undoDepth: (state) => state.undoStack.length,
    redoDepth: (state) => state.redoStack.length,
    canSave: (state) => state.isDirty,
  },
  actions: {
    // Start a fresh, never-saved template. Used for the New-form flow.
    initializeTemplate(id: string): void {
      this.template = createEmptyTemplate(id);
      this.undoStack = [];
      this.redoStack = [];
      this.clearCoalesceTimer();
      this.coalesceKey = null;
      this.isPersisted = false;
      this.isDirty = false;
      this.revision = 0;
      this.saveStatus = 'idle';
      this.lastSavedAt = null;
      this.lastSaveError = null;
    },

    // Load an existing, already-persisted template from the server. Resets
    // history and marks the store clean.
    loadTemplate(template: FormTemplate): void {
      this.template = cloneTemplate(template);
      this.undoStack = [];
      this.redoStack = [];
      this.clearCoalesceTimer();
      this.coalesceKey = null;
      this.isPersisted = true;
      this.isDirty = false;
      this.revision = 0;
      this.saveStatus = 'saved';
      this.lastSavedAt = Date.now();
      this.lastSaveError = null;
    },

    // --- history primitives ---------------------------------------------------

    // Push the CURRENT template snapshot onto the undo stack, so the caller can
    // then mutate `this.template` freely and `undo()` will restore the snapshot.
    // Discrete mutations pass coalesceKey=null; text-input coalesced mutations
    // pass a stable key like `"label:<fieldId>"` and only the first call in a
    // window pushes.
    beginStep(coalesceKey: string | null): void {
      if (!this.template) return;

      // Any user mutation makes the in-memory template diverge from the last
      // successful save. Set this BEFORE the coalesce early-return so
      // in-flight typing also flips the flag and bumps the revision counter.
      this.isDirty = true;
      this.revision++;

      if (coalesceKey !== null && coalesceKey === this.coalesceKey) {
        // Continuing an in-flight coalesced edit: refresh the pause timer, do
        // not push a new step, do not clear redo (the redo stack was already
        // cleared when the coalesced step first started).
        this.armCoalesceTimer();
        return;
      }

      // Any new discrete or different-key edit ends the previous coalesce
      // window without changing state (the snapshot was already pushed when
      // that window opened).
      this.clearCoalesceTimer();

      this.undoStack.push({ snapshot: cloneTemplate(this.template) });
      if (this.undoStack.length > HISTORY_CAP) {
        this.undoStack.shift();
      }
      this.redoStack = [];

      this.coalesceKey = coalesceKey;
      if (coalesceKey !== null) {
        this.armCoalesceTimer();
      }
    },

    armCoalesceTimer(): void {
      this.clearCoalesceTimer();
      coalesceTimer = setTimeout(() => {
        this.coalesceKey = null;
        coalesceTimer = null;
      }, COALESCE_MS);
    },

    clearCoalesceTimer(): void {
      if (coalesceTimer !== null) {
        clearTimeout(coalesceTimer);
        coalesceTimer = null;
      }
    },

    // Close the in-flight coalesce window immediately (call from `blur`).
    // The step already sits on the undo stack; we just prevent future edits
    // from folding into it.
    flushCoalesce(): void {
      this.clearCoalesceTimer();
      this.coalesceKey = null;
    },

    undo(): void {
      if (!this.template || this.undoStack.length === 0) return;
      this.flushCoalesce();
      const step = this.undoStack.pop()!;
      this.redoStack.push({ snapshot: cloneTemplate(this.template) });
      this.template = step.snapshot;
      this.isDirty = true;
      this.revision++;
    },

    redo(): void {
      if (!this.template || this.redoStack.length === 0) return;
      this.flushCoalesce();
      const step = this.redoStack.pop()!;
      this.undoStack.push({ snapshot: cloneTemplate(this.template) });
      this.template = step.snapshot;
      this.isDirty = true;
      this.revision++;
    },

    // --- mutations ------------------------------------------------------------

    setTitle(title: string): void {
      if (!this.template) return;
      if (this.template.title === title) return;
      this.beginStep('title');
      this.template.title = title;
      this.template.updatedAt = Date.now();
    },

    setDescription(description: string): void {
      if (!this.template) return;
      if (this.template.description === description) return;
      this.beginStep('description');
      this.template.description = description;
      this.template.updatedAt = Date.now();
    },

    addTextField(): FieldId | null {
      return this.addField('text');
    },

    addParagraphField(): FieldId | null {
      return this.addField('paragraph');
    },

    addCheckboxField(): FieldId | null {
      return this.addField('checkbox');
    },

    addRadioField(): FieldId | null {
      return this.addField('radio');
    },

    addSelectField(): FieldId | null {
      return this.addField('select');
    },

    // Central add-field entry point. Each variant delegates here so the
    // history bookkeeping (beginStep, updatedAt) lives in exactly one place.
    addField(type: Field['type']): FieldId | null {
      if (!this.template) return null;
      this.beginStep(null);
      const id = crypto.randomUUID();
      let field: Field;
      switch (type) {
        case 'text':
          field = createTextField(id);
          break;
        case 'paragraph':
          field = createParagraphField(id);
          break;
        case 'checkbox':
          field = createCheckboxField(id, crypto.randomUUID());
          break;
        case 'radio':
          field = createRadioField(id, crypto.randomUUID());
          break;
        case 'select':
          field = createSelectField(id, crypto.randomUUID());
          break;
        default: {
          const _exhaustive: never = type;
          return _exhaustive;
        }
      }
      this.template.fields.push(field);
      this.template.updatedAt = Date.now();
      return field.id;
    },

    // Move `fieldId` to index `toIndex` in the template's field list. No-ops
    // if the field is already there — an ADR-0003 reorder that ends where it
    // started must not push a HistoryStep.
    moveField(fieldId: FieldId, toIndex: number): void {
      if (!this.template) return;
      const from = this.template.fields.findIndex((f) => f.id === fieldId);
      if (from === -1) return;
      const clamped = Math.max(0, Math.min(toIndex, this.template.fields.length - 1));
      if (from === clamped) return;
      this.beginStep(null);
      const [moved] = this.template.fields.splice(from, 1);
      this.template.fields.splice(clamped, 0, moved!);
      this.template.updatedAt = Date.now();
    },

    // Apply a full reordering of the field list from a drag/keyboard gesture.
    // Accepts the finalised order as an array of field ids and commits exactly
    // one HistoryStep. A no-op (same order or unknown id set) does not push.
    // The pointer/keyboard reorder components use this so the library's own
    // "final values" event maps 1:1 to a single undo step.
    reorderFields(newOrder: FieldId[]): void {
      if (!this.template) return;
      const current = this.template.fields;
      if (newOrder.length !== current.length) return;
      const byId = new Map(current.map((f) => [f.id, f] as const));
      const reordered: Field[] = [];
      for (const id of newOrder) {
        const f = byId.get(id);
        if (!f) return;
        reordered.push(f);
      }
      let same = true;
      for (let i = 0; i < current.length; i++) {
        if (current[i]!.id !== reordered[i]!.id) {
          same = false;
          break;
        }
      }
      if (same) return;
      this.beginStep(null);
      this.template.fields = reordered;
      this.template.updatedAt = Date.now();
    },

    // Same shape as `reorderFields` but for a choice field's option list.
    reorderFieldOptions(fieldId: FieldId, newOrder: OptionId[]): void {
      const field = this.findField(fieldId);
      if (!field || !isChoiceField(field)) return;
      const current = field.options;
      if (newOrder.length !== current.length) return;
      const byId = new Map(current.map((o) => [o.id, o] as const));
      const reordered: FieldOption[] = [];
      for (const id of newOrder) {
        const o = byId.get(id);
        if (!o) return;
        reordered.push(o);
      }
      let same = true;
      for (let i = 0; i < current.length; i++) {
        if (current[i]!.id !== reordered[i]!.id) {
          same = false;
          break;
        }
      }
      if (same) return;
      this.beginStep(null);
      field.options = reordered;
      this.template!.updatedAt = Date.now();
    },

    deleteField(fieldId: FieldId): void {
      if (!this.template) return;
      const idx = this.template.fields.findIndex((f) => f.id === fieldId);
      if (idx === -1) return;
      this.beginStep(null);
      this.template.fields.splice(idx, 1);
      this.template.updatedAt = Date.now();
    },

    setFieldLabel(fieldId: FieldId, label: string): void {
      const field = this.findField(fieldId);
      if (!field || field.label === label) return;
      this.beginStep(`label:${fieldId}`);
      field.label = label;
      this.template!.updatedAt = Date.now();
    },

    setFieldDescription(fieldId: FieldId, description: string): void {
      const field = this.findField(fieldId);
      if (!field || (field.description ?? '') === description) return;
      this.beginStep(`description:${fieldId}`);
      field.description = description;
      this.template!.updatedAt = Date.now();
    },

    setFieldRequired(fieldId: FieldId, required: boolean): void {
      const field = this.findField(fieldId);
      if (!field || field.required === required) return;
      this.beginStep(null);
      field.required = required;
      this.template!.updatedAt = Date.now();
    },

    setTextFieldPlaceholder(fieldId: FieldId, placeholder: string): void {
      const field = this.findField(fieldId);
      if (!field) return;
      if (field.type !== 'text' && field.type !== 'paragraph') return;
      if ((field.placeholder ?? '') === placeholder) return;
      this.beginStep(`placeholder:${fieldId}`);
      field.placeholder = placeholder;
      this.template!.updatedAt = Date.now();
    },

    // --- option-list mutations (checkbox/radio/select) ------------------------

    addFieldOption(fieldId: FieldId): OptionId | null {
      const field = this.findField(fieldId);
      if (!field || !isChoiceField(field)) return null;
      this.beginStep(null);
      const option: FieldOption = { id: crypto.randomUUID(), label: '' };
      field.options.push(option);
      this.template!.updatedAt = Date.now();
      return option.id;
    },

    setFieldOptionLabel(fieldId: FieldId, optionId: OptionId, label: string): void {
      const field = this.findField(fieldId);
      if (!field || !isChoiceField(field)) return;
      const option = field.options.find((o) => o.id === optionId);
      if (!option || option.label === label) return;
      this.beginStep(`option-label:${fieldId}:${optionId}`);
      option.label = label;
      this.template!.updatedAt = Date.now();
    },

    deleteFieldOption(fieldId: FieldId, optionId: OptionId): void {
      const field = this.findField(fieldId);
      if (!field || !isChoiceField(field)) return;
      const idx = field.options.findIndex((o) => o.id === optionId);
      if (idx === -1) return;
      this.beginStep(null);
      field.options.splice(idx, 1);
      this.template!.updatedAt = Date.now();
    },

    // Move `optionId` to index `toIndex` in the field's option list. No-ops
    // if the option is already there — matches ticket 03's "reorder that ends
    // where it started does not push a step" rule for fields.
    moveFieldOption(fieldId: FieldId, optionId: OptionId, toIndex: number): void {
      const field = this.findField(fieldId);
      if (!field || !isChoiceField(field)) return;
      const from = field.options.findIndex((o) => o.id === optionId);
      if (from === -1) return;
      const clamped = Math.max(0, Math.min(toIndex, field.options.length - 1));
      if (from === clamped) return;
      this.beginStep(null);
      const [moved] = field.options.splice(from, 1);
      field.options.splice(clamped, 0, moved!);
      this.template!.updatedAt = Date.now();
    },

    findField(fieldId: FieldId): Field | undefined {
      return this.template?.fields.find((f) => f.id === fieldId);
    },

    // --- save ----------------------------------------------------------------

    // Persist the current template. Chooses POST (first save) vs PUT (updates)
    // based on `isPersisted`. Captures the dirty flag at request start so a
    // concurrent user edit while the request is in flight keeps `isDirty` true
    // and the change survives the roundtrip.
    async save(): Promise<void> {
      if (!this.template) return;
      if (!saveTransport) {
        throw new Error('No save transport configured (call setTemplateSaveTransport in main.ts)');
      }
      if (!this.isDirty && this.isPersisted) return;

      const wasPersisted = this.isPersisted;
      const snapshot = cloneTemplate(this.template);
      snapshot.updatedAt = Date.now();

      this.saveStatus = 'saving';
      this.lastSaveError = null;
      try {
        if (wasPersisted) {
          await saveTransport.update(snapshot);
        } else {
          await saveTransport.create(snapshot);
        }
        // Only clear `isDirty` if the in-memory template hasn't changed since
        // we snapshotted. If the user typed during the save, the diff is real
        // and the next autosave/manual save should still fire.
        const stillMatchesSnapshot = templatesEqual(this.template, snapshot);
        if (stillMatchesSnapshot) {
          this.isDirty = false;
        }
        this.isPersisted = true;
        this.saveStatus = 'saved';
        this.lastSavedAt = Date.now();
      } catch (err) {
        this.saveStatus = 'failed';
        this.lastSaveError = err instanceof Error ? err.message : String(err);
        throw err;
      }
    },
  },
});

// Shallow-serialised equality — the template is plain JSON, so JSON.stringify
// is a sound structural comparison and cheap enough at editor scale.
function templatesEqual(a: FormTemplate | null, b: FormTemplate | null): boolean {
  if (a === null || b === null) return a === b;
  // Ignore updatedAt when comparing — we bump it at save time so it will
  // always differ from what the user has in memory pre-next-mutation.
  const stripTs = (t: FormTemplate) => ({ ...t, updatedAt: 0 });
  return JSON.stringify(stripTs(a)) === JSON.stringify(stripTs(b));
}

export type { ChoiceField };
