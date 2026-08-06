import { describe, expect, it } from 'vitest';
import { cn } from '../../lib/cn.ts';
import { buttonVariants, textControlVariants } from './variants.ts';

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
