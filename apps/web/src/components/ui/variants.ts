import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cva, type VariantProps } from 'class-variance-authority';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer disabled:pointer-events-none',
    'focus-ring',
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

export const textControlVariants = cva(
  [
    'w-full rounded-md px-3 py-2 text-sm leading-relaxed text-fg',
    'placeholder:text-muted-fg disabled:opacity-40',
    'focus-ring',
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

export const badgeVariants = cva(
  'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        neutral: 'bg-surface text-muted-fg',
        primary: 'bg-primary/15 text-primary',
        danger: 'bg-danger/15 text-danger',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

export const alertVariants = cva('rounded-lg border p-4 text-sm shadow-sm', {
  variants: {
    variant: {
      info: 'border-border bg-surface-elevated text-fg',
      warning: 'border-warning/40 bg-warning/10 text-fg',
      danger: 'border-danger/30 bg-danger/10 text-danger-fg',
      success: 'border-primary/30 bg-primary/10 text-fg',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

export type AlertVariants = VariantProps<typeof alertVariants>;
