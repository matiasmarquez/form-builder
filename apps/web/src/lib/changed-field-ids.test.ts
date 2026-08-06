import { describe, expect, it } from 'vitest';
import type { FormTemplate } from '@form-builder/shared';
import { changedFieldIds } from './changed-field-ids.ts';

function template(fields: FormTemplate['fields']): FormTemplate {
  return {
    id: 'form-1',
    title: 'T',
    description: '',
    fields,
    createdAt: 1,
    updatedAt: 1,
  };
}

describe('changedFieldIds', () => {
  it('returns empty when templates match', () => {
    const t = template([
      { id: 'a', type: 'text', label: 'A', required: false },
    ]);
    expect(changedFieldIds(t, structuredClone(t))).toEqual([]);
  });

  it('detects a mutated field', () => {
    const before = template([
      { id: 'a', type: 'text', label: 'A', required: false },
    ]);
    const after = template([
      { id: 'a', type: 'text', label: 'B', required: false },
    ]);
    expect(changedFieldIds(before, after)).toEqual(['a']);
  });

  it('detects an added field (present after)', () => {
    const before = template([]);
    const after = template([
      { id: 'a', type: 'text', label: 'A', required: false },
    ]);
    expect(changedFieldIds(before, after)).toEqual(['a']);
  });

  it('ignores a removed field (nothing left to expand)', () => {
    const before = template([
      { id: 'a', type: 'text', label: 'A', required: false },
    ]);
    const after = template([]);
    expect(changedFieldIds(before, after)).toEqual([]);
  });

  it('ignores title-only changes', () => {
    const before = template([
      { id: 'a', type: 'text', label: 'A', required: false },
    ]);
    const after = { ...structuredClone(before), title: 'Other' };
    expect(changedFieldIds(before, after)).toEqual([]);
  });
});
