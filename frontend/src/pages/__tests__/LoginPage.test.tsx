import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LoginPage from '../LoginPage';
import { AuthProvider } from '@/context/AuthContext';
import { authService } from '@/services/authService';

/**
 * Pruebas de ejemplo para `LoginPage` (Formulario_Login).
 *
 * Cubren:
 * - Requirement 8.5: con datos válidos, el envío invoca `authService.login`
 *   (que apunta a `api/auth/login`).
 * - Requirement 8.2: con la contraseña vacía la validación falla y no se envía
 *   la solicitud.
 * - Requirement 8.6: un campo que tenía un error de validación se revalida
 *   dentro de 500 ms tras el último cambio (debounce en modo `onChange`).
 */

// Mock del servicio de autenticación: es la frontera que efectúa
// `POST api/auth/login`. Verificar su invocación confirma que el envío del
// formulario válido llega al endpoint correcto (Req 8.5).
vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(),
  },
}));

// Aislar la navegación de react-router para no depender de un router real.
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/** Debe coincidir con el debounce de revalidación de `LoginPage` (Req 8.6). */
const VALIDATION_DEBOUNCE_MS = 500;

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Requirement 8.5: envío con datos válidos', () => {
    it('invoca authService.login con las credenciales al enviar datos válidos', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.login).mockResolvedValue({ token: 'jwt-token', expiresIn: 3600 });

      renderLoginPage();

      await user.type(screen.getByLabelText('Nombre de usuario'), 'usuarioValido');
      await user.type(screen.getByLabelText('Contraseña'), 'contrasenaSegura');

      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledTimes(1);
      });
      expect(authService.login).toHaveBeenCalledWith({
        username: 'usuarioValido',
        password: 'contrasenaSegura',
      });
    });
  });

  describe('Requirement 8.2: contraseña vacía bloquea el envío', () => {
    it('muestra error y no invoca authService.login cuando la contraseña está vacía', async () => {
      const user = userEvent.setup();

      renderLoginPage();

      // Nombre de usuario válido, contraseña vacía.
      await user.type(screen.getByLabelText('Nombre de usuario'), 'usuarioValido');

      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // El validador reporta la contraseña obligatoria y se bloquea el envío.
      await waitFor(() => {
        expect(document.getElementById('error-password')).toBeInTheDocument();
      });
      expect(document.getElementById('error-password')?.textContent).toMatch(/obligatoria/i);
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 8.6: revalidación con debounce dentro de 500 ms', () => {
    it('revalida un campo con error dentro de 500 ms tras el último cambio', () => {
      vi.useFakeTimers();
      try {
        renderLoginPage();

        const usernameInput = screen.getByLabelText('Nombre de usuario');

        // Escribir un valor inválido (menos de 3 caracteres) para provocar el error.
        // `fireEvent.change` dispara el `onChange` de React de forma síncrona,
        // sin depender de temporizadores internos.
        act(() => {
          fireEvent.change(usernameInput, { target: { value: 'ab' } });
        });

        // Antes de que transcurra el debounce no debe existir el mensaje de error.
        expect(document.getElementById('error-username')).toBeNull();

        // Avanzar el temporizador de debounce (~500 ms) → aparece el error.
        act(() => {
          vi.advanceTimersByTime(VALIDATION_DEBOUNCE_MS);
        });
        expect(document.getElementById('error-username')).toBeInTheDocument();
        expect(document.getElementById('error-username')?.textContent).toMatch(
          /entre 3 y 50 caracteres/i
        );

        // Corregir el campo: el mismo campo se revalida dentro de 500 ms y el
        // mensaje de error se oculta (Req 8.6).
        act(() => {
          fireEvent.change(usernameInput, { target: { value: 'usuarioValido' } });
        });
        act(() => {
          vi.advanceTimersByTime(VALIDATION_DEBOUNCE_MS);
        });

        expect(document.getElementById('error-username')).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
