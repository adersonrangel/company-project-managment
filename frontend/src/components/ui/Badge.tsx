import { type HTMLAttributes } from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { badgeVariants } from './badgeVariants';

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export default function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
