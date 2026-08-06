import { cva, type VariantProps } from 'class-variance-authority';
import { FOCUS_RING_CLASSES } from '../../lib/focus-ring.ts';

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer disabled:pointer-events-none',
    FOCUS_RING_CLASSES,
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg hover:bg-primary-hover',
        secondary:
          'border border-border-strong bg-surface-elevated text-fg hover:bg-surface-hover',
        ghost: 'bg-transparent text-fg hover:bg-surface-hover',
        danger: 'bg-danger text-white hover:opacity-90',
      },
      size: {
        sm: '',
        md: '',
      },
      iconOnly: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { iconOnly: true, size: 'sm', class: 'size-8' },
      { iconOnly: true, size: 'md', class: 'size-11' },
      { iconOnly: false, size: 'sm', class: 'h-8 px-3 text-sm' },
      { iconOnly: false, size: 'md', class: 'h-10 px-4 text-sm' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      iconOnly: false,
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
