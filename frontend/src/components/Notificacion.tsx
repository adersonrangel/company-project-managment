import { useEffect, useRef } from 'react';
import './Notificacion.css';

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
      className={`notificacion notificacion--${tipo}`}
      role="alert"
    >
      <span>{mensaje}</span>
      <button
        className="notificacion__close"
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
