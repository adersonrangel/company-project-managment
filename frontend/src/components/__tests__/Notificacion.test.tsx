import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Notificacion from '../Notificacion';

const defaultProps = {
  mensaje: 'Operación exitosa',
  tipo: 'exito' as const,
  visible: true,
  onClose: vi.fn(),
};

describe('Notificacion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Renderizado', () => {
    it('renders success notification with class .notificacion--exito and shows message', () => {
      const { container } = render(<Notificacion {...defaultProps} />);

      expect(screen.getByText('Operación exitosa')).toBeInTheDocument();
      const notificacion = container.querySelector('.notificacion');
      expect(notificacion).toHaveClass('notificacion--exito');
    });

    it('renders error notification with class .notificacion--error and shows message', () => {
      const { container } = render(
        <Notificacion {...defaultProps} tipo="error" mensaje="Algo salió mal" />
      );

      expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
      const notificacion = container.querySelector('.notificacion');
      expect(notificacion).toHaveClass('notificacion--error');
    });

    it('does not render when visible is false', () => {
      const { container } = render(
        <Notificacion {...defaultProps} visible={false} />
      );

      expect(container.innerHTML).toBe('');
    });
  });

  describe('Auto-dismiss', () => {
    it('calls onClose after 4 seconds', () => {
      const onClose = vi.fn();
      render(<Notificacion {...defaultProps} onClose={onClose} />);

      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cierre manual', () => {
    it('calls onClose on close button click and cancels timer', () => {
      const onClose = vi.fn();
      render(<Notificacion {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: 'Cerrar notificación' });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);

      // Advance timers — onClose should NOT be called again
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accesibilidad', () => {
    it('has role="alert" attribute', () => {
      render(<Notificacion {...defaultProps} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('close button has aria-label="Cerrar notificación"', () => {
      render(<Notificacion {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'Cerrar notificación' });
      expect(closeButton).toHaveAttribute('aria-label', 'Cerrar notificación');
    });
  });

  describe('Timer restart on message change', () => {
    it('restarts timer when message changes — onClose called exactly once after 4s from rerender', () => {
      const onClose = vi.fn();
      const { rerender } = render(
        <Notificacion {...defaultProps} onClose={onClose} mensaje="Primer mensaje" />
      );

      // Advance 3 seconds (timer not yet fired)
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(onClose).not.toHaveBeenCalled();

      // Change message — timer should restart
      rerender(
        <Notificacion {...defaultProps} onClose={onClose} mensaje="Segundo mensaje" />
      );

      // Advance 3 seconds from rerender (total 6s from start, but only 3s from rerender)
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(onClose).not.toHaveBeenCalled();

      // Advance 1 more second (4s from rerender) — should fire
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
