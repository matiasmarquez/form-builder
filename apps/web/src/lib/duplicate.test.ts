import { describe, expect, it } from 'vitest';
import type { FormTemplate } from '@form-builder/shared';
import { duplicateTemplate } from './duplicate.ts';

function makeTemplate(): FormTemplate {
  return {
    id: 'tpl-1',
    title: 'Original',
    description: 'desc',
    createdAt: 1000,
    updatedAt: 2000,
    fields: [
      { id: 'f1', label: 'Name', required: true, type: 'text', placeholder: 'you' },
      {
        id: 'f2',
        label: 'Colors',
        required: false,
        type: 'checkbox',
        options: [
          { id: 'o1', label: 'Red' },
          { id: 'o2', label: 'Blue' },
        ],
      },
      {
        id: 'f3',
        label: 'Pick',
        required: false,
        type: 'radio',
        options: [{ id: 'o3', label: 'A' }],
      },
    ],
  };
}

describe('duplicateTemplate', () => {
  it('suffixes the title with " (copia)"', () => {
    const copy = duplicateTemplate(makeTemplate());
    expect(copy.title).toBe('Original (copia)');
  });

  it('regenerates ids at every level', () => {
    const src = makeTemplate();
    const copy = duplicateTemplate(src);
    expect(copy.id).not.toBe(src.id);
    for (const [i, field] of copy.fields.entries()) {
      expect(field.id).not.toBe(src.fields[i]!.id);
    }
    const srcCheckbox = src.fields[1]!;
    const copyCheckbox = copy.fields[1]!;
    if (srcCheckbox.type !== 'checkbox' || copyCheckbox.type !== 'checkbox') {
      throw new Error('expected checkbox field');
    }
    for (const [i, opt] of copyCheckbox.options.entries()) {
      expect(opt.id).not.toBe(srcCheckbox.options[i]!.id);
      expect(opt.label).toBe(srcCheckbox.options[i]!.label);
    }
  });

  it('does not mutate the source template', () => {
    const src = makeTemplate();
    const snapshot = JSON.parse(JSON.stringify(src));
    duplicateTemplate(src);
    expect(src).toEqual(snapshot);
  });

  it('produces a template that round-trips through the schema', async () => {
    const { formTemplateSchema } = await import('@form-builder/shared');
    const copy = duplicateTemplate(makeTemplate());
    expect(() => formTemplateSchema.parse(copy)).not.toThrow();
  });

  it('sets createdAt and updatedAt to now', () => {
    const before = Date.now();
    const copy = duplicateTemplate(makeTemplate());
    const after = Date.now();
    expect(copy.createdAt).toBeGreaterThanOrEqual(before);
    expect(copy.createdAt).toBeLessThanOrEqual(after);
    expect(copy.updatedAt).toBe(copy.createdAt);
  });
});
