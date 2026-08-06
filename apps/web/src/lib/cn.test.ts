import { describe, expect, it } from 'vitest';
import { cn } from './cn.ts';

describe('cn', () => {
  it('joins truthy class names and skips falsy values', () => {
    expect(cn('px-2', false && 'hidden', null, undefined, 'py-1')).toBe(
      'px-2 py-1',
    );
  });

  it('lets a later conflicting Tailwind text-size utility win', () => {
    expect(cn('text-sm', 'text-3xl font-semibold')).toBe(
      'text-3xl font-semibold',
    );
  });

  it('lets later text-color utilities win while keeping unrelated classes', () => {
    expect(
      cn('text-fg hover:bg-surface-hover', 'text-muted-fg/80 hover:text-danger'),
    ).toBe('hover:bg-surface-hover text-muted-fg/80 hover:text-danger');
  });
});
