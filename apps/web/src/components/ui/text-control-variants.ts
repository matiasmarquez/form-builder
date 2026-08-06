import { cva, type VariantProps } from 'class-variance-authority';
import { FOCUS_RING_CLASSES } from '../../lib/focus-ring.ts';

export const textControlVariants = cva(
  [
    'w-full rounded-md px-3 py-2 text-sm leading-relaxed text-fg',
    'placeholder:text-muted-fg disabled:opacity-40',
    FOCUS_RING_CLASSES,
  ],
  {
    variants: {
      variant: {
        bordered: 'border border-border-strong bg-surface-elevated',
        'inline-borderless': [
          'border-0 bg-transparent shadow-none cursor-text',
          'hover:bg-surface-hover',
          'focus-visible:bg-surface-hover',
        ],
      },
    },
    defaultVariants: {
      variant: 'bordered',
    },
  },
);

export type TextControlVariants = VariantProps<typeof textControlVariants>;
