import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium ' +
    'transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
    'disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'bg-card text-foreground border border-border hover:bg-muted',
        danger: 'bg-danger text-danger-foreground hover:bg-danger-hover',
        ghost: 'bg-transparent text-primary hover:bg-primary/10',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
