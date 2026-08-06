import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { FormTemplate } from '@form-builder/shared';
import { usePreviewStore } from './preview.ts';

const REQUIRED_MSG = 'This field is required';

function makeTemplate(overrides: Partial<FormTemplate> = {}): FormTemplate {
  return {
    id: 't1',
    title: 'Survey',
    description: 'Please fill in',
    fields: [
      { id: 'f1', type: 'text', label: 'Name', required: true, description: 'Your full name' },
      {
        id: 'f2',
        type: 'radio',
        label: 'Color',
        required: true,
        options: [
          { id: 'red', label: 'Red' },
          { id: 'blue', label: 'Blue' },
        ],
      },
    ],
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('preview store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('exposes no field errors before the first submit attempt', () => {
    const store = usePreviewStore();
    store.loadTemplate(makeTemplate());

    expect(store.hasAttemptedSubmit).toBe(false);
    expect(store.fieldErrors).toEqual({});
  });

  it('blocks submit and surfaces errors for empty required fields', () => {
    const store = usePreviewStore();
    store.loadTemplate(makeTemplate());

    const ok = store.submit();

    expect(ok).toBe(false);
    expect(store.hasAttemptedSubmit).toBe(true);
    expect(store.isSubmitted).toBe(false);
    expect(store.fieldErrors).toEqual({
      f1: REQUIRED_MSG,
      f2: REQUIRED_MSG,
    });
  });

  it('returns the first invalid field id in template order', () => {
    const store = usePreviewStore();
    store.loadTemplate(makeTemplate());
    store.submit();

    expect(store.firstInvalidFieldId()).toBe('f1');
  });

  it('marks submit successful when every required field is filled', () => {
    const store = usePreviewStore();
    store.loadTemplate(makeTemplate());
    store.setAnswer('f1', 'Ada');
    store.setAnswer('f2', 'red');

    const ok = store.submit();

    expect(ok).toBe(true);
    expect(store.isSubmitted).toBe(true);
    expect(store.fieldErrors).toEqual({});
  });

  it('does not re-validate on blur before the first submit attempt', () => {
    const store = usePreviewStore();
    store.loadTemplate(makeTemplate());

    store.blurField('f1');

    expect(store.fieldErrors).toEqual({});
    expect(store.touched.f1).toBe(true);
  });

  it('re-validates a field on blur after the first submit attempt', () => {
    const store = usePreviewStore();
    store.loadTemplate(makeTemplate());
    store.submit();
    expect(store.fieldErrors.f1).toBe(REQUIRED_MSG);

    store.setAnswer('f1', 'Ada');
    store.blurField('f1');

    expect(store.fieldErrors.f1).toBeUndefined();
    expect(store.fieldErrors.f2).toBe(REQUIRED_MSG);
  });

  it('re-shows an error on blur if the field is emptied after submit', () => {
    const store = usePreviewStore();
    store.loadTemplate(makeTemplate());
    store.setAnswer('f1', 'Ada');
    store.setAnswer('f2', 'red');
    store.submit();
    expect(store.isSubmitted).toBe(true);

    store.setAnswer('f1', '');
    store.blurField('f1');

    expect(store.isSubmitted).toBe(false);
    expect(store.fieldErrors.f1).toBe(REQUIRED_MSG);
  });

  it('initializes checkbox answers as empty arrays', () => {
    const store = usePreviewStore();
    store.loadTemplate(
      makeTemplate({
        fields: [
          {
            id: 'c1',
            type: 'checkbox',
            label: 'Tags',
            required: false,
            options: [{ id: 'a', label: 'A' }],
          },
        ],
      }),
    );

    expect(store.answers.c1).toEqual([]);
  });
});
