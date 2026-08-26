import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-card border border-dashed border-border rounded-[var(--radius-lg)] px-6 py-12 text-center',
        className
      )}
    >
      <p className="text-foreground font-medium m-0">{title}</p>
      {description && <p className="text-muted-foreground text-sm mt-1 mb-0">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
