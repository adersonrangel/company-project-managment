import { useRef, useEffect, useCallback } from 'react';
import { useProyectoForm } from '@/hooks/useProyectoForm';
import type { ProyectoListResponse, ProyectoResponse } from '@/types/proyecto';
import './EmpresaFormModal.css';

interface ProyectoFormModalProps {
  isOpen: boolean;
  modo: 'crear' | 'editar';
  empresaId: number;
  proyectoInicial?: ProyectoListResponse | null;
  onClose: () => void;
  onSuccess: (proyecto: ProyectoResponse) => void;
}

const FOCUSABLE_SELECTOR = 'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function ProyectoFormModal({ isOpen, modo, empresaId, proyectoInicial, onClose, onSuccess }: ProyectoFormModalProps) {
  const {
    formData,
    errores,
    errorServidor,
    submitting,
    handleChange,
    handleSubmit,
  } = useProyectoForm({ modo, empresaId, proyectoInicial, onSuccess, onClose });

  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Capture the previously focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    }
  }, [isOpen]);

  // Auto-focus the first input when modal opens and restore focus on close
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is rendered before focusing
      const timeoutId = setTimeout(() => {
        const firstInput = modalRef.current?.querySelector<HTMLElement>('input');
        firstInput?.focus();
      }, 0);

      return () => clearTimeout(timeoutId);
    } else {
      // Restore focus to the previously focused element when modal closes
      if (previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
        previouslyFocusedRef.current = null;
      }
    }
  }, [isOpen]);

  // Handle focus trap and Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (!submitting) {
        onClose();
      }
      return;
    }

    if (e.key === 'Tab') {
      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement | undefined;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement | undefined;

      if (!firstElement || !lastElement) return;

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [submitting, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Handle overlay click (close modal unless submitting)
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !submitting) {
      onClose();
    }
  }, [submitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const titleId = 'proyecto-modal-title';
  const title = modo === 'crear' ? 'Agregar Proyecto' : 'Editar Proyecto';

  // Collect current field errors for aria-live announcement
  const errorMessages = [errores.nombre, errores.fechaHabilitacion].filter(Boolean);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="modal-title">
          {title}
        </h2>

        {errorServidor && (
          <div className="modal-error-banner" role="alert">
            {errorServidor}
          </div>
        )}

        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          noValidate
        >
          <div className="form-field">
            <label htmlFor="proyecto-nombre">Nombre</label>
            <input
              id="proyecto-nombre"
              type="text"
              placeholder="Nombre del proyecto"
              maxLength={100}
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              disabled={submitting}
              className={errores.nombre ? 'input-error' : ''}
              aria-invalid={!!errores.nombre}
              aria-describedby={errores.nombre ? 'error-proyecto-nombre' : undefined}
            />
            {errores.nombre && (
              <p id="error-proyecto-nombre" className="field-error-message">
                {errores.nombre}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="proyecto-fecha-habilitacion">Fecha de Habilitación</label>
            <input
              id="proyecto-fecha-habilitacion"
              type="date"
              min="2000-01-01"
              value={formData.fechaHabilitacion}
              onChange={(e) => handleChange('fechaHabilitacion', e.target.value)}
              disabled={submitting}
              className={errores.fechaHabilitacion ? 'input-error' : ''}
              aria-invalid={!!errores.fechaHabilitacion}
              aria-describedby={errores.fechaHabilitacion ? 'error-proyecto-fecha' : undefined}
            />
            {errores.fechaHabilitacion && (
              <p id="error-proyecto-fecha" className="field-error-message">
                {errores.fechaHabilitacion}
              </p>
            )}
          </div>

          <div className="form-field">
            <label className="checkbox-label">
              <input
                id="proyecto-estado"
                type="checkbox"
                checked={formData.estadoHabilitacion}
                onChange={(e) => handleChange('estadoHabilitacion', e.target.checked)}
                disabled={submitting}
              />
              Proyecto habilitado
            </label>
          </div>

          {/* Aria-live region to announce validation errors to screen readers */}
          <div aria-live="polite" className="sr-only">
            {errorMessages.length > 0 && errorMessages.join('. ')}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="primary"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProyectoFormModal;
