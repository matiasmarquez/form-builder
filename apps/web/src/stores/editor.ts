import { defineStore } from 'pinia';
import type { Field, FieldId, FormTemplate, TextField } from '@form-builder/shared';

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

interface EditorState {
  template: FormTemplate | null;
}

// All mutations on the FormTemplate go through named actions so that a future
// undo/redo layer (see ADR-0003) can wrap them without touching call sites.
export const useEditorStore = defineStore('editor', {
  state: (): EditorState => ({ template: null }),
  actions: {
    initializeTemplate(id: string): void {
      this.template = createEmptyTemplate(id);
    },
    setTitle(title: string): void {
      if (!this.template) return;
      this.template.title = title;
      this.template.updatedAt = Date.now();
    },
    setDescription(description: string): void {
      if (!this.template) return;
      this.template.description = description;
      this.template.updatedAt = Date.now();
    },
    addTextField(): FieldId | null {
      if (!this.template) return null;
      const field = createTextField(crypto.randomUUID());
      this.template.fields.push(field);
      this.template.updatedAt = Date.now();
      return field.id;
    },
    deleteField(fieldId: FieldId): void {
      if (!this.template) return;
      this.template.fields = this.template.fields.filter((f) => f.id !== fieldId);
      this.template.updatedAt = Date.now();
    },
    setFieldLabel(fieldId: FieldId, label: string): void {
      this.mutateField(fieldId, (field) => {
        field.label = label;
      });
    },
    setFieldDescription(fieldId: FieldId, description: string): void {
      this.mutateField(fieldId, (field) => {
        field.description = description;
      });
    },
    setFieldRequired(fieldId: FieldId, required: boolean): void {
      this.mutateField(fieldId, (field) => {
        field.required = required;
      });
    },
    setTextFieldPlaceholder(fieldId: FieldId, placeholder: string): void {
      this.mutateField(fieldId, (field) => {
        if (field.type === 'text') {
          field.placeholder = placeholder;
        }
      });
    },
    // Not exposed as a public "action" in the user-facing sense; helper used
    // by the per-property setters above so each setter reads as a single intent.
    mutateField(fieldId: FieldId, mutator: (field: Field) => void): void {
      if (!this.template) return;
      const field = this.template.fields.find((f) => f.id === fieldId);
      if (!field) return;
      mutator(field);
      this.template.updatedAt = Date.now();
    },
  },
});
