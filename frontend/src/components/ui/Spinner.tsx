import { cn } from '@/utils/cn';

interface SpinnerProps {
  label?: string;
  className?: string;
}

export default function Spinner({ label = 'Cargando', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('flex items-center justify-center py-16', className)}
    >
      <span className="h-9 w-9 rounded-full border-4 border-muted border-t-primary animate-spin" />
    </div>
  );
}
