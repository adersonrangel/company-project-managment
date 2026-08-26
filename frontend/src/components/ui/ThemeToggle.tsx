import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/cn';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'Activar tema claro' : 'Activar tema oscuro'}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]',
        'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-white/10',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors',
        className
      )}
    >
      <span aria-hidden="true" className="text-lg leading-none">
        {isDark ? '\u2600\uFE0F' : '\u{1F319}'}
      </span>
    </button>
  );
}
