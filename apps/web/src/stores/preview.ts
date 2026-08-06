import { defineStore } from 'pinia';
import {
  validateFormResponse,
  type Answer,
  type FieldErrors,
  type FieldId,
  type FormResponse,
  type FormTemplate,
} from '@form-builder/shared';

function emptyAnswerFor(field: FormTemplate['fields'][number]): Answer {
  switch (field.type) {
    case 'checkbox':
      return [];
    case 'text':
    case 'paragraph':
    case 'radio':
    case 'select':
      return '';
  }
}

function buildInitialAnswers(template: FormTemplate): FormResponse['answers'] {
  const answers: FormResponse['answers'] = {};
  for (const field of template.fields) {
    answers[field.id] = emptyAnswerFor(field);
  }
  return answers;
}

interface PreviewState {
  template: FormTemplate | null;
  answers: FormResponse['answers'];
  touched: Record<FieldId, boolean>;
  hasAttemptedSubmit: boolean;
  isSubmitted: boolean;
  fieldErrors: FieldErrors;
}

export const usePreviewStore = defineStore('preview', {
  state: (): PreviewState => ({
    template: null,
    answers: {},
    touched: {},
    hasAttemptedSubmit: false,
    isSubmitted: false,
    fieldErrors: {},
  }),
  getters: {
    response(state): FormResponse | null {
      if (!state.template) return null;
      return { templateId: state.template.id, answers: state.answers };
    },
  },
  actions: {
    loadTemplate(template: FormTemplate): void {
      this.template = template;
      this.answers = buildInitialAnswers(template);
      this.touched = {};
      this.hasAttemptedSubmit = false;
      this.isSubmitted = false;
      this.fieldErrors = {};
    },

    setAnswer(fieldId: FieldId, answer: Answer): void {
      if (!this.template) return;
      this.answers[fieldId] = answer;
      // Clearing a successful confirmation if the respondent edits again.
      if (this.isSubmitted) {
        this.isSubmitted = false;
      }
    },

    /**
     * Mark a field as touched (blur). After the first submit attempt,
     * re-validate that field and update `fieldErrors`.
     */
    blurField(fieldId: FieldId): void {
      this.touched[fieldId] = true;
      if (!this.hasAttemptedSubmit || !this.response) return;
      const all = validateFormResponse(this.template!, this.response);
      if (all[fieldId]) {
        this.fieldErrors = { ...this.fieldErrors, [fieldId]: all[fieldId] };
      } else {
        const next = { ...this.fieldErrors };
        delete next[fieldId];
        this.fieldErrors = next;
      }
    },

    /**
     * Attempt submission. Returns whether it succeeded.
     * On failure: sets `hasAttemptedSubmit`, populates `fieldErrors`.
     * On success: sets `isSubmitted` (client-only; no HTTP).
     */
    submit(): boolean {
      if (!this.template || !this.response) return false;
      this.hasAttemptedSubmit = true;
      const errors = validateFormResponse(this.template, this.response);
      this.fieldErrors = errors;
      if (Object.keys(errors).length > 0) {
        this.isSubmitted = false;
        return false;
      }
      this.isSubmitted = true;
      return true;
    },

    /** Ordered list of invalid field ids (template order) — for focus/scroll. */
    firstInvalidFieldId(): FieldId | null {
      if (!this.template) return null;
      for (const field of this.template.fields) {
        if (this.fieldErrors[field.id]) return field.id;
      }
      return null;
    },
  },
});
