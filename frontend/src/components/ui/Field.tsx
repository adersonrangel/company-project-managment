import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-[var(--radius-md)] border border-input bg-card px-3 py-2 text-sm text-foreground',
        'outline-none transition-colors placeholder:text-muted-foreground',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30',
        'aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/30',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  errorId?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, error, errorId, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p id={errorId} className="text-xs text-danger m-0">
          {error}
        </p>
      )}
    </div>
  );
}
