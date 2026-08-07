import { describe, expect, it } from 'vitest';
import { buttonVariants, cn, textControlVariants } from './variants.ts';

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

describe('buttonVariants with cn', () => {
  it('lets consumer text color override ghost variant text without important', () => {
    const classes = cn(
      buttonVariants({ variant: 'ghost', size: 'sm', iconOnly: true }),
      'text-muted-fg/80 hover:text-danger',
    );

    expect(classes).toContain('text-muted-fg/80');
    expect(classes).toContain('hover:text-danger');
    expect(classes.split(/\s+/)).not.toContain('text-fg');
  });
});

describe('textControlVariants with cn', () => {
  it('lets consumer text size override base text-sm without important', () => {
    const classes = cn(
      textControlVariants({ variant: 'inline-borderless' }),
      'text-3xl font-semibold',
    );

    expect(classes).toContain('text-3xl');
    expect(classes.split(/\s+/)).not.toContain('text-sm');
  });
});
