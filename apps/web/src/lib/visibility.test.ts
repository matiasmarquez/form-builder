import { describe, expect, it } from 'vitest';
import {
  computeVisibleFieldIds,
  detectVisibilityCycle,
  evaluateVisibilityRule,
  validateFormResponse,
  type Field,
  type FormResponse,
  type FormTemplate,
  type VisibilityRule,
} from '@form-builder/shared';

const REQUIRED_MSG = 'This field is required';

function template(fields: Field[]): FormTemplate {
  return {
    id: 't1',
    title: 'Test',
    description: '',
    fields,
    createdAt: 0,
    updatedAt: 0,
  };
}

function response(answers: FormResponse['answers']): FormResponse {
  return { templateId: 't1', answers };
}

describe('evaluateVisibilityRule', () => {
  it('matches an equals rule on a radio answer', () => {
    const rule: VisibilityRule = {
      sourceFieldId: 'f1',
      condition: { kind: 'equals', optionId: 'yes' },
    };
    expect(evaluateVisibilityRule(rule, { f1: 'yes' })).toBe(true);
    expect(evaluateVisibilityRule(rule, { f1: 'no' })).toBe(false);
    expect(evaluateVisibilityRule(rule, {})).toBe(false);
  });

  it('matches an includes rule on a checkbox answer', () => {
    const rule: VisibilityRule = {
      sourceFieldId: 'f1',
      condition: { kind: 'includes', optionId: 'x' },
    };
    expect(evaluateVisibilityRule(rule, { f1: ['x', 'y'] })).toBe(true);
    expect(evaluateVisibilityRule(rule, { f1: ['y'] })).toBe(false);
    expect(evaluateVisibilityRule(rule, { f1: 'x' })).toBe(false);
  });
});

describe('computeVisibleFieldIds', () => {
  it('shows a field with no rule', () => {
    const t = template([{ id: 'a', type: 'text', label: '', required: false }]);
    const v = computeVisibleFieldIds(t, {});
    expect([...v]).toEqual(['a']);
  });

  it('hides a gated field until its source matches', () => {
    const t = template([
      {
        id: 'g',
        type: 'radio',
        label: 'Gate',
        required: false,
        options: [
          { id: 'yes', label: 'Yes' },
          { id: 'no', label: 'No' },
        ],
      },
      {
        id: 'child',
        type: 'text',
        label: 'Child',
        required: false,
        visibility: {
          sourceFieldId: 'g',
          condition: { kind: 'equals', optionId: 'yes' },
        },
      },
    ]);
    expect(computeVisibleFieldIds(t, { g: '' }).has('child')).toBe(false);
    expect(computeVisibleFieldIds(t, { g: 'yes' }).has('child')).toBe(true);
    expect(computeVisibleFieldIds(t, { g: 'no' }).has('child')).toBe(false);
  });

  it('cascades: hiding a gate hides its dependants (fixed point)', () => {
    // g1 controls c1 (equals=yes); c1 controls c2 (equals=go). If g1 flips
    // to "no" c1 becomes hidden, and by fixed-point c2 must also disappear
    // even though the raw answers[c1] would still equal 'go'.
    const t = template([
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
        id: 'c1',
        type: 'radio',
        label: '',
        required: false,
        options: [
          { id: 'go', label: '' },
          { id: 'stop', label: '' },
        ],
        visibility: { sourceFieldId: 'g1', condition: { kind: 'equals', optionId: 'yes' } },
      },
      {
        id: 'c2',
        type: 'text',
        label: '',
        required: false,
        visibility: { sourceFieldId: 'c1', condition: { kind: 'equals', optionId: 'go' } },
      },
    ]);

    const yesGo = computeVisibleFieldIds(t, { g1: 'yes', c1: 'go' });
    expect(yesGo.has('c1')).toBe(true);
    expect(yesGo.has('c2')).toBe(true);

    const noStaleGo = computeVisibleFieldIds(t, { g1: 'no', c1: 'go' });
    expect(noStaleGo.has('c1')).toBe(false);
    expect(noStaleGo.has('c2')).toBe(false);
  });
});

describe('detectVisibilityCycle', () => {
  it('returns null for an acyclic graph', () => {
    const t = template([
      {
        id: 'a',
        type: 'radio',
        label: '',
        required: false,
        options: [{ id: 'y', label: '' }],
      },
      {
        id: 'b',
        type: 'text',
        label: '',
        required: false,
        visibility: { sourceFieldId: 'a', condition: { kind: 'equals', optionId: 'y' } },
      },
    ]);
    expect(detectVisibilityCycle(t)).toBeNull();
  });

  it('detects a 2-node cycle', () => {
    const t = template([
      {
        id: 'a',
        type: 'text',
        label: '',
        required: false,
        visibility: { sourceFieldId: 'b', condition: { kind: 'equals', optionId: 'y' } },
      },
      {
        id: 'b',
        type: 'text',
        label: '',
        required: false,
        visibility: { sourceFieldId: 'a', condition: { kind: 'equals', optionId: 'y' } },
      },
    ]);
    const cycle = detectVisibilityCycle(t);
    expect(cycle).not.toBeNull();
    expect(new Set(cycle!.fieldIds)).toEqual(new Set(['a', 'b']));
  });

  it('detects a self-loop', () => {
    const t = template([
      {
        id: 'a',
        type: 'text',
        label: '',
        required: false,
        visibility: { sourceFieldId: 'a', condition: { kind: 'equals', optionId: 'y' } },
      },
    ]);
    expect(detectVisibilityCycle(t)?.fieldIds).toContain('a');
  });

  it('ignores rules pointing at unknown source fields', () => {
    const t = template([
      {
        id: 'a',
        type: 'text',
        label: '',
        required: false,
        visibility: { sourceFieldId: 'ghost', condition: { kind: 'equals', optionId: 'y' } },
      },
    ]);
    expect(detectVisibilityCycle(t)).toBeNull();
  });
});

describe('validateFormResponse — visibility-aware', () => {
  it('skips required errors for fields not in the visible set', () => {
    const t = template([
      { id: 'a', type: 'text', label: '', required: true },
      { id: 'b', type: 'text', label: '', required: true },
    ]);
    const errors = validateFormResponse(
      t,
      response({ a: '', b: '' }),
      new Set(['a']),
    );
    expect(errors).toEqual({ a: REQUIRED_MSG });
  });
});
