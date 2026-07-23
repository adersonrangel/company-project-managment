import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EmpresaFormModal from '../EmpresaFormModal';
import type { Empresa } from '@/types/empresa';

vi.mock('@/services/empresaService', () => ({
  empresaService: {
    crear: vi.fn(),
    actualizar: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    isAxiosError: vi.fn(() => false),
  },
  isAxiosError: vi.fn(() => false),
}));

const defaultProps = {
  isOpen: true,
  modo: 'crear' as const,
  empresaInicial: null,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

const empresaExistente: Empresa = {
  id: 1,
  nombre: 'Empresa Test',
  identificacion: 'NIT-123456',
  direccion: 'Dirección Test 123',
  telefono: '1234567',
  estadoHabilitacion: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: null,
};

describe('EmpresaFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Renderizado', () => {
    it('renders correctly with fields (Nombre, Dirección, Teléfono), labels, and buttons (Guardar, Cancelar)', () => {
      render(<EmpresaFormModal {...defaultProps} />);

      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
      expect(screen.getByLabelText('Dirección')).toBeInTheDocument();
      expect(screen.getByLabelText('Teléfono')).toBeInTheDocument();

      expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });

    it('does NOT render when isOpen is false', () => {
      const { container } = render(<EmpresaFormModal {...defaultProps} isOpen={false} />);
      expect(container.innerHTML).toBe('');
    });
  });

  describe('ARIA attributes', () => {
    it('has role="dialog", aria-modal="true", and aria-labelledby pointing to the title', () => {
      render(<EmpresaFormModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'empresa-modal-title');

      const title = document.getElementById('empresa-modal-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Agregar Empresa');
    });
  });

  describe('Cierre del modal', () => {
    it('closes on Escape key press — calls onClose', () => {
      const onClose = vi.fn();
      render(<EmpresaFormModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes on overlay click — calls onClose', () => {
      const onClose = vi.fn();
      const { container } = render(<EmpresaFormModal {...defaultProps} onClose={onClose} />);

      const overlay = container.querySelector('.modal-overlay')!;
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT close on Escape during submit (when submitting is true)', async () => {
      const { empresaService } = await import('@/services/empresaService');
      // Return a never-resolving promise to keep submitting=true
      (empresaService.crear as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

      const onClose = vi.fn();
      render(<EmpresaFormModal {...defaultProps} onClose={onClose} />);

      // Fill in valid data so submit proceeds
      const nombreInput = screen.getByLabelText('Nombre');
      const direccionInput = screen.getByLabelText('Dirección');
      const telefonoInput = screen.getByLabelText('Teléfono');

      await userEvent.type(nombreInput, 'Empresa Valid');
      await userEvent.type(direccionInput, 'Dirección Válida 123');
      await userEvent.type(telefonoInput, '1234567');

      // Submit form
      const saveButton = screen.getByRole('button', { name: 'Guardar' });
      await userEvent.click(saveButton);

      // Wait for submitting state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
      });

      // Reset onClose count after submission click
      onClose.mockClear();

      // Try to close with Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('does NOT close on overlay click during submit', async () => {
      const { empresaService } = await import('@/services/empresaService');
      (empresaService.crear as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

      const onClose = vi.fn();
      const { container } = render(<EmpresaFormModal {...defaultProps} onClose={onClose} />);

      const nombreInput = screen.getByLabelText('Nombre');
      const direccionInput = screen.getByLabelText('Dirección');
      const telefonoInput = screen.getByLabelText('Teléfono');

      await userEvent.type(nombreInput, 'Empresa Valid');
      await userEvent.type(direccionInput, 'Dirección Válida 123');
      await userEvent.type(telefonoInput, '1234567');

      const saveButton = screen.getByRole('button', { name: 'Guardar' });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
      });

      onClose.mockClear();

      const overlay = container.querySelector('.modal-overlay')!;
      fireEvent.click(overlay);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('Cancel button calls onClose', () => {
      const onClose = vi.fn();
      render(<EmpresaFormModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Focus trap', () => {
    it('Tab wraps from last to first focusable element', () => {
      vi.useFakeTimers();
      render(<EmpresaFormModal {...defaultProps} />);
      vi.runAllTimers();

      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled])'
      );

      const lastElement = focusableElements[focusableElements.length - 1]!;
      const firstElement = focusableElements[0]!;

      // Focus the last element
      lastElement.focus();
      expect(document.activeElement).toBe(lastElement);

      // Press Tab — should wrap to first
      fireEvent.keyDown(document, { key: 'Tab' });

      expect(document.activeElement).toBe(firstElement);
    });
  });

  describe('Auto-focus', () => {
    it('first input (nombre) is focused when modal opens', () => {
      vi.useFakeTimers();
      render(<EmpresaFormModal {...defaultProps} />);

      vi.runAllTimers();

      const nombreInput = screen.getByLabelText('Nombre');
      expect(document.activeElement).toBe(nombreInput);
    });
  });

  describe('Modo edición', () => {
    it('renders with pre-loaded data from empresaInicial', () => {
      render(
        <EmpresaFormModal
          {...defaultProps}
          modo="editar"
          empresaInicial={empresaExistente}
        />
      );

      expect(screen.getByLabelText('Nombre')).toHaveValue('Empresa Test');
      expect(screen.getByLabelText('Dirección')).toHaveValue('Dirección Test 123');
      expect(screen.getByLabelText('Teléfono')).toHaveValue('1234567');
    });
  });

  describe('Estado de envío', () => {
    it('Save button shows "Guardando..." and is disabled during submit', async () => {
      const { empresaService } = await import('@/services/empresaService');
      (empresaService.crear as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

      render(<EmpresaFormModal {...defaultProps} />);

      await userEvent.type(screen.getByLabelText('Nombre'), 'Empresa Valid');
      await userEvent.type(screen.getByLabelText('Dirección'), 'Dirección Válida 123');
      await userEvent.type(screen.getByLabelText('Teléfono'), '1234567');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: 'Guardando...' });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Título del modal', () => {
    it('shows "Agregar Empresa" in create mode', () => {
      render(<EmpresaFormModal {...defaultProps} modo="crear" />);
      expect(screen.getByText('Agregar Empresa')).toBeInTheDocument();
    });

    it('shows "Editar Empresa" in edit mode', () => {
      render(
        <EmpresaFormModal
          {...defaultProps}
          modo="editar"
          empresaInicial={empresaExistente}
        />
      );
      expect(screen.getByText('Editar Empresa')).toBeInTheDocument();
    });
  });
});
