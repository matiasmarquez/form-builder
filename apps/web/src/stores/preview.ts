import { defineStore } from 'pinia';
import {
  computeVisibleFieldIds,
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
    /**
     * Field ids currently visible under the visibility rule graph. Recomputed
     * from `answers` on every access — Pinia caches it per reactive read.
     * Hidden fields are excluded from the DOM and from validation (ADR-0005).
     */
    visibleFieldIds(state): Set<FieldId> {
      if (!state.template) return new Set();
      return computeVisibleFieldIds(state.template, state.answers);
    },
    isFieldVisible(): (fieldId: FieldId) => boolean {
      const set = this.visibleFieldIds;
      return (fieldId: FieldId) => set.has(fieldId);
    },
    visibleFields(state): FormTemplate['fields'] {
      if (!state.template) return [];
      const set = this.visibleFieldIds;
      return state.template.fields.filter((f) => set.has(f.id));
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
      this.reconcileHiddenAnswers();
    },

    setAnswer(fieldId: FieldId, answer: Answer): void {
      if (!this.template) return;
      this.answers[fieldId] = answer;
      // Clearing a successful confirmation if the respondent edits again.
      if (this.isSubmitted) {
        this.isSubmitted = false;
      }
      // ADR-0005: when a field becomes hidden its Answer is cleared. Run the
      // fixed point after every mutation so cascading rules converge and
      // stale answers do not survive the next re-show.
      this.reconcileHiddenAnswers();
    },

    /**
     * Reset every currently-hidden field's answer to its empty value, and
     * drop any stale error for hidden fields. Called after every answer
     * mutation so the response never carries data for a field the
     * respondent cannot see. Idempotent — re-running with a stable
     * visibility set is a no-op.
     */
    reconcileHiddenAnswers(): void {
      if (!this.template) return;
      const visible = computeVisibleFieldIds(this.template, this.answers);
      let touched = false;
      for (const field of this.template.fields) {
        if (visible.has(field.id)) continue;
        const empty = emptyAnswerFor(field);
        const current = this.answers[field.id];
        const same =
          Array.isArray(empty) && Array.isArray(current)
            ? current.length === 0
            : current === empty;
        if (!same) {
          this.answers[field.id] = empty;
          touched = true;
        }
        if (this.fieldErrors[field.id]) {
          const next = { ...this.fieldErrors };
          delete next[field.id];
          this.fieldErrors = next;
        }
      }
      // A visibility change may itself unhide a chain further downstream —
      // computeVisibleFieldIds already runs its own fixed point, so a single
      // pass here is sufficient once answers stabilise.
      if (touched) {
        const after = computeVisibleFieldIds(this.template, this.answers);
        if (after.size !== visible.size) {
          this.reconcileHiddenAnswers();
        }
      }
    },

    /**
     * Mark a field as touched (blur). After the first submit attempt,
     * re-validate that field and update `fieldErrors`.
     */
    blurField(fieldId: FieldId): void {
      this.touched[fieldId] = true;
      if (!this.hasAttemptedSubmit || !this.response) return;
      const all = validateFormResponse(this.template!, this.response, this.visibleFieldIds);
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
      const errors = validateFormResponse(this.template, this.response, this.visibleFieldIds);
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
      const visible = this.visibleFieldIds;
      for (const field of this.template.fields) {
        if (!visible.has(field.id)) continue;
        if (this.fieldErrors[field.id]) return field.id;
      }
      return null;
    },
  },
});
