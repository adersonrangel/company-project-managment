import { type ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { cn } from '@/utils/cn';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Ancho máximo del contenido. */
  maxWidthClassName?: string;
  /** Elemento(s) de acción en el pie del diálogo. */
  footer?: ReactNode;
  /** Ícono decorativo opcional sobre el título. */
  icon?: ReactNode;
}

/**
 * Diálogo modal accesible sobre Radix: foco atrapado, Escape para cerrar,
 * aria-modal y retorno de foco al trigger gestionados por Radix.
 */
export default function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  icon,
  maxWidthClassName = 'max-w-[480px]',
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[1000] bg-black/50 data-[state=open]:animate-in" />
        <RadixDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[1001] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
            'bg-card text-card-foreground rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]',
            'p-6 max-h-[90vh] overflow-y-auto',
            maxWidthClassName
          )}
        >
          {icon && <div className="mb-3 flex justify-center">{icon}</div>}
          <RadixDialog.Title className="text-lg font-semibold text-foreground m-0">
            {title}
          </RadixDialog.Title>
          {description && (
            <RadixDialog.Description className="text-sm text-muted-foreground mt-1 mb-0">
              {description}
            </RadixDialog.Description>
          )}
          {children && <div className="mt-4">{children}</div>}
          {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
