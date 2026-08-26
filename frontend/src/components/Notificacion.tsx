import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

interface NotificacionProps {
  mensaje: string;
  tipo: 'exito' | 'error';
  visible: boolean;
  onClose: () => void;
}

function Notificacion({ mensaje, tipo, visible, onClose }: NotificacionProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Clear any existing timer (handles replacement/restart of notifications)
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Set auto-dismiss timer for 4 seconds
      timerRef.current = setTimeout(() => {
        onClose();
      }, 4000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, mensaje, onClose]);

  if (!visible) {
    return null;
  }

  const handleClose = () => {
    // Cancel timer on manual close
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onClose();
  };

  return (
    <div
      className={cn(
        'notificacion',
        `notificacion--${tipo}`,
        'fixed top-4 right-4 z-[1100] flex items-center gap-3 rounded-[var(--radius-md)]',
        'px-4 py-3 text-sm font-medium shadow-[var(--shadow-md)] max-w-sm',
        tipo === 'exito'
          ? 'bg-success text-success-foreground'
          : 'bg-danger text-danger-foreground'
      )}
      role="alert"
    >
      <span>{mensaje}</span>
      <button
        className="notificacion__close ml-auto inline-flex h-6 w-6 items-center justify-center rounded text-lg leading-none opacity-80 hover:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        onClick={handleClose}
        aria-label="Cerrar notificación"
        type="button"
      >
        ×
      </button>
    </div>
  );
}

export default Notificacion;
