import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
  {
    variants: {
      tone: {
        success: 'bg-success-soft text-success-soft-foreground',
        danger: 'bg-danger-soft text-danger-soft-foreground',
        warning: 'bg-warning/15 text-warning',
        neutral: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  }
);
