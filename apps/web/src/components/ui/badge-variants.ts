import { cva, type VariantProps } from 'class-variance-authority';

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
