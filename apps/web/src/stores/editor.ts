import { defineStore } from 'pinia';
import type { Field, FieldId, FormTemplate, TextField } from '@form-builder/shared';

export const HISTORY_CAP = 100;
export const COALESCE_MS = 500;

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
  }),
  getters: {
    canUndo: (state) => state.undoStack.length > 0,
    canRedo: (state) => state.redoStack.length > 0,
    undoDepth: (state) => state.undoStack.length,
    redoDepth: (state) => state.redoStack.length,
  },
  actions: {
    initializeTemplate(id: string): void {
      this.template = createEmptyTemplate(id);
      this.undoStack = [];
      this.redoStack = [];
      this.clearCoalesceTimer();
      this.coalesceKey = null;
    },

    // --- history primitives ---------------------------------------------------

    // Push the CURRENT template snapshot onto the undo stack, so the caller can
    // then mutate `this.template` freely and `undo()` will restore the snapshot.
    // Discrete mutations pass coalesceKey=null; text-input coalesced mutations
    // pass a stable key like `"label:<fieldId>"` and only the first call in a
    // window pushes.
    beginStep(coalesceKey: string | null): void {
      if (!this.template) return;

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
    },

    redo(): void {
      if (!this.template || this.redoStack.length === 0) return;
      this.flushCoalesce();
      const step = this.redoStack.pop()!;
      this.undoStack.push({ snapshot: cloneTemplate(this.template) });
      this.template = step.snapshot;
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
      if (!this.template) return null;
      this.beginStep(null);
      const field = createTextField(crypto.randomUUID());
      this.template.fields.push(field);
      this.template.updatedAt = Date.now();
      return field.id;
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
      if (!field || field.type !== 'text') return;
      if ((field.placeholder ?? '') === placeholder) return;
      this.beginStep(`placeholder:${fieldId}`);
      field.placeholder = placeholder;
      this.template!.updatedAt = Date.now();
    },

    findField(fieldId: FieldId): Field | undefined {
      return this.template?.fields.find((f) => f.id === fieldId);
    },
  },
});
