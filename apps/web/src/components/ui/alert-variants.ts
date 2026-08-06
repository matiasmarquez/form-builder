import { cva, type VariantProps } from 'class-variance-authority';

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
