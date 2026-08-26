import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

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

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export default function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
