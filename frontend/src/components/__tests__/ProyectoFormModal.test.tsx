import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProyectoFormModal from '../ProyectoFormModal';
import type { ProyectoListResponse } from '@/types/proyecto';

vi.mock('@/services/proyectoService', () => ({
  proyectoService: {
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
  empresaId: 1,
  proyectoInicial: null,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

const proyectoExistente: ProyectoListResponse = {
  id: 10,
  nombre: 'Proyecto Alpha',
  fechaHabilitacion: '2024-06-15',
  estadoHabilitacion: false,
};

describe('ProyectoFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Render create mode', () => {
    it('shows "Agregar Proyecto" title, empty nombre input, empty date input, and checked checkbox', () => {
      render(<ProyectoFormModal {...defaultProps} />);

      expect(screen.getByText('Agregar Proyecto')).toBeInTheDocument();

      const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
      expect(nombreInput).toHaveValue('');

      const fechaInput = screen.getByLabelText('Fecha de Habilitación') as HTMLInputElement;
      expect(fechaInput).toHaveValue('');

      const checkbox = screen.getByRole('checkbox', { name: /proyecto habilitado/i }) as HTMLInputElement;
      expect(checkbox).toBeChecked();
    });
  });

  describe('Render edit mode', () => {
    it('shows "Editar Proyecto" title, nombre filled, date filled, checkbox reflects value', () => {
      render(
        <ProyectoFormModal
          {...defaultProps}
          modo="editar"
          proyectoInicial={proyectoExistente}
        />
      );

      expect(screen.getByText('Editar Proyecto')).toBeInTheDocument();

      const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
      expect(nombreInput).toHaveValue('Proyecto Alpha');

      const fechaInput = screen.getByLabelText('Fecha de Habilitación') as HTMLInputElement;
      expect(fechaInput).toHaveValue('2024-06-15');

      const checkbox = screen.getByRole('checkbox', { name: /proyecto habilitado/i }) as HTMLInputElement;
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Does not render when closed', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(<ProyectoFormModal {...defaultProps} isOpen={false} />);
      expect(container.innerHTML).toBe('');
    });
  });

  describe('Auto-focus on first input', () => {
    it('nombre input has focus when modal opens', () => {
      vi.useFakeTimers();
      render(<ProyectoFormModal {...defaultProps} />);

      vi.runAllTimers();

      const nombreInput = screen.getByLabelText('Nombre');
      expect(document.activeElement).toBe(nombreInput);
    });
  });

  describe('Close on Escape', () => {
    it('pressing Escape calls onClose', () => {
      const onClose = vi.fn();
      render(<ProyectoFormModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Close on overlay click', () => {
    it('clicking the overlay div calls onClose', () => {
      const onClose = vi.fn();
      const { container } = render(<ProyectoFormModal {...defaultProps} onClose={onClose} />);

      const overlay = container.querySelector('.modal-overlay')!;
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Close on Cancel button', () => {
    it('clicking Cancelar calls onClose', () => {
      const onClose = vi.fn();
      render(<ProyectoFormModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disable during submit', () => {
    it('when submitting, all inputs and buttons are disabled, button shows "Guardando..."', async () => {
      const { proyectoService } = await import('@/services/proyectoService');
      // Return a never-resolving promise to keep submitting=true
      (proyectoService.crear as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

      render(<ProyectoFormModal {...defaultProps} />);

      // Fill valid data so submit proceeds past validation
      const nombreInput = screen.getByLabelText('Nombre');
      const fechaInput = screen.getByLabelText('Fecha de Habilitación');

      await userEvent.type(nombreInput, 'Proyecto Válido');
      await userEvent.type(fechaInput, '2024-06-15');

      // Submit the form
      const saveButton = screen.getByRole('button', { name: 'Guardar' });
      await userEvent.click(saveButton);

      // Wait for submitting state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
      });

      // Verify inputs are disabled
      expect(screen.getByLabelText('Nombre')).toBeDisabled();
      expect(screen.getByLabelText('Fecha de Habilitación')).toBeDisabled();
      expect(screen.getByRole('checkbox', { name: /proyecto habilitado/i })).toBeDisabled();

      // Verify Cancel button is also disabled
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    });
  });

  describe('ARIA attributes', () => {
    it('has role="dialog", aria-modal="true", and aria-labelledby pointing to title', () => {
      render(<ProyectoFormModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'proyecto-modal-title');

      const title = document.getElementById('proyecto-modal-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Agregar Proyecto');
    });
  });

  describe('Focus trap', () => {
    it('Tab on last element moves focus to first', () => {
      vi.useFakeTimers();
      render(<ProyectoFormModal {...defaultProps} />);
      vi.runAllTimers();

      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

    it('Shift+Tab on first element moves focus to last', () => {
      vi.useFakeTimers();
      render(<ProyectoFormModal {...defaultProps} />);
      vi.runAllTimers();

      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0]!;
      const lastElement = focusableElements[focusableElements.length - 1]!;

      // Focus the first element
      firstElement.focus();
      expect(document.activeElement).toBe(firstElement);

      // Press Shift+Tab — should wrap to last
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(lastElement);
    });
  });
});
