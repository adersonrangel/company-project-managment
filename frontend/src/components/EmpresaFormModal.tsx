import { useRef, useEffect, useCallback } from 'react';
import { useEmpresaForm } from '@/hooks/useEmpresaForm';
import type { Empresa } from '@/types/empresa';
import './EmpresaFormModal.css';

interface EmpresaFormModalProps {
  isOpen: boolean;
  modo: 'crear' | 'editar';
  empresaInicial?: Empresa | null;
  onClose: () => void;
  onSuccess: (empresa: Empresa) => void;
}

const FOCUSABLE_SELECTOR = 'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function EmpresaFormModal({ isOpen, modo, empresaInicial, onClose, onSuccess }: EmpresaFormModalProps) {
  const {
    formData,
    errores,
    errorServidor,
    submitting,
    handleChange,
    handleSubmit,
  } = useEmpresaForm({ modo, empresaInicial, onSuccess, onClose });

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

  const titleId = 'empresa-modal-title';
  const title = modo === 'crear' ? 'Agregar Empresa' : 'Editar Empresa';

  // Collect current field errors for aria-live announcement
  const errorMessages = [errores.nombre, errores.identificacion, errores.direccion, errores.telefono].filter(Boolean);

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
            <label htmlFor="empresa-nombre">Nombre</label>
            <input
              id="empresa-nombre"
              type="text"
              placeholder="Nombre de la empresa"
              maxLength={100}
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className={errores.nombre ? 'input-error' : ''}
              aria-invalid={!!errores.nombre}
              aria-describedby={errores.nombre ? 'error-nombre' : undefined}
            />
            {errores.nombre && (
              <p id="error-nombre" className="field-error-message">
                {errores.nombre}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="empresa-identificacion">Identificación</label>
            <input
              id="empresa-identificacion"
              type="text"
              placeholder="NIT o identificación"
              maxLength={50}
              value={formData.identificacion}
              onChange={(e) => handleChange('identificacion', e.target.value)}
              className={errores.identificacion ? 'input-error' : ''}
              aria-invalid={!!errores.identificacion}
              aria-describedby={errores.identificacion ? 'error-identificacion' : undefined}
            />
            {errores.identificacion && (
              <p id="error-identificacion" className="field-error-message">
                {errores.identificacion}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="empresa-direccion">Dirección</label>
            <input
              id="empresa-direccion"
              type="text"
              placeholder="Dirección de la empresa"
              maxLength={200}
              value={formData.direccion}
              onChange={(e) => handleChange('direccion', e.target.value)}
              className={errores.direccion ? 'input-error' : ''}
              aria-invalid={!!errores.direccion}
              aria-describedby={errores.direccion ? 'error-direccion' : undefined}
            />
            {errores.direccion && (
              <p id="error-direccion" className="field-error-message">
                {errores.direccion}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="empresa-telefono">Teléfono</label>
            <input
              id="empresa-telefono"
              type="text"
              placeholder="Teléfono de contacto"
              maxLength={20}
              value={formData.telefono}
              onChange={(e) => handleChange('telefono', e.target.value)}
              className={errores.telefono ? 'input-error' : ''}
              aria-invalid={!!errores.telefono}
              aria-describedby={errores.telefono ? 'error-telefono' : undefined}
            />
            {errores.telefono && (
              <p id="error-telefono" className="field-error-message">
                {errores.telefono}
              </p>
            )}
          </div>

          <div className="form-field">
            <label className="checkbox-label">
              <input
                id="empresa-estado"
                type="checkbox"
                checked={formData.estadoHabilitacion}
                onChange={(e) => handleChange('estadoHabilitacion', e.target.checked)}
              />
              Empresa habilitada
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

export default EmpresaFormModal;
