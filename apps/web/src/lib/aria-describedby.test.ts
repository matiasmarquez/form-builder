import { describe, expect, it } from 'vitest';
import { joinAriaDescribedBy } from './aria-describedby.ts';

describe('joinAriaDescribedBy', () => {
  it('returns undefined when nothing is linked', () => {
    expect(joinAriaDescribedBy()).toBeUndefined();
    expect(joinAriaDescribedBy(undefined, false, '')).toBeUndefined();
  });

  it('joins description and error ids in order', () => {
    expect(joinAriaDescribedBy('field-1-description', 'field-1-error')).toBe(
      'field-1-description field-1-error',
    );
  });

  it('omits falsy entries while preserving order', () => {
    expect(joinAriaDescribedBy(undefined, 'field-1-error')).toBe('field-1-error');
    expect(joinAriaDescribedBy('field-1-description', false)).toBe(
      'field-1-description',
    );
  });
});
