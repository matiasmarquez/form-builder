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

  describe('visibility (ADR-0005)', () => {
    function templateWithGate(): FormTemplate {
      return {
        id: 't1',
        title: 'Gated',
        description: '',
        fields: [
          {
            id: 'gate',
            type: 'radio',
            label: 'Own a pet?',
            required: true,
            options: [
              { id: 'yes', label: 'Yes' },
              { id: 'no', label: 'No' },
            ],
          },
          {
            id: 'name',
            type: 'text',
            label: 'Pet name',
            required: true,
            visibility: {
              sourceFieldId: 'gate',
              condition: { kind: 'equals', optionId: 'yes' },
            },
          },
        ],
        createdAt: 0,
        updatedAt: 0,
      };
    }

    it('hides a gated field until the gate matches, and lists only visible fields', () => {
      const store = usePreviewStore();
      store.loadTemplate(templateWithGate());

      expect(store.visibleFieldIds.has('name')).toBe(false);
      expect(store.visibleFields.map((f) => f.id)).toEqual(['gate']);

      store.setAnswer('gate', 'yes');

      expect(store.visibleFieldIds.has('name')).toBe(true);
      expect(store.visibleFields.map((f) => f.id)).toEqual(['gate', 'name']);
    });

    it('clears a hidden field answer when the gate flips', () => {
      const store = usePreviewStore();
      store.loadTemplate(templateWithGate());
      store.setAnswer('gate', 'yes');
      store.setAnswer('name', 'Fido');
      expect(store.answers.name).toBe('Fido');

      store.setAnswer('gate', 'no');

      expect(store.visibleFieldIds.has('name')).toBe(false);
      expect(store.answers.name).toBe('');
    });

    it('cascades: a hidden gate hides its dependants and clears their answers', () => {
      const template: FormTemplate = {
        id: 't1',
        title: '',
        description: '',
        fields: [
          {
            id: 'g1',
            type: 'radio',
            label: '',
            required: false,
            options: [
              { id: 'yes', label: '' },
              { id: 'no', label: '' },
            ],
          },
          {
            id: 'g2',
            type: 'radio',
            label: '',
            required: false,
            options: [
              { id: 'go', label: '' },
              { id: 'stop', label: '' },
            ],
            visibility: {
              sourceFieldId: 'g1',
              condition: { kind: 'equals', optionId: 'yes' },
            },
          },
          {
            id: 'leaf',
            type: 'text',
            label: '',
            required: false,
            visibility: {
              sourceFieldId: 'g2',
              condition: { kind: 'equals', optionId: 'go' },
            },
          },
        ],
        createdAt: 0,
        updatedAt: 0,
      };
      const store = usePreviewStore();
      store.loadTemplate(template);
      store.setAnswer('g1', 'yes');
      store.setAnswer('g2', 'go');
      store.setAnswer('leaf', 'hello');
      expect(store.visibleFieldIds.has('leaf')).toBe(true);

      store.setAnswer('g1', 'no');

      expect(store.visibleFieldIds.has('g2')).toBe(false);
      expect(store.visibleFieldIds.has('leaf')).toBe(false);
      expect(store.answers.g2).toBe('');
      expect(store.answers.leaf).toBe('');
    });

    it('excludes hidden required fields from submit validation', () => {
      const store = usePreviewStore();
      store.loadTemplate(templateWithGate());
      // gate answered 'no' → name hidden. gate itself is required.
      store.setAnswer('gate', 'no');

      const ok = store.submit();

      expect(ok).toBe(true);
      expect(store.fieldErrors).toEqual({});
    });

    it('supports "includes" on checkbox source fields', () => {
      const template: FormTemplate = {
        id: 't1',
        title: '',
        description: '',
        fields: [
          {
            id: 'tags',
            type: 'checkbox',
            label: '',
            required: false,
            options: [
              { id: 'a', label: '' },
              { id: 'b', label: '' },
            ],
          },
          {
            id: 'detail',
            type: 'text',
            label: '',
            required: false,
            visibility: {
              sourceFieldId: 'tags',
              condition: { kind: 'includes', optionId: 'a' },
            },
          },
        ],
        createdAt: 0,
        updatedAt: 0,
      };
      const store = usePreviewStore();
      store.loadTemplate(template);
      expect(store.visibleFieldIds.has('detail')).toBe(false);
      store.setAnswer('tags', ['a']);
      expect(store.visibleFieldIds.has('detail')).toBe(true);
      store.setAnswer('tags', ['b']);
      expect(store.visibleFieldIds.has('detail')).toBe(false);
    });
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
