// Feature: user-logout, Property 4: navigate('/login') ocurre si y solo si logout tuvo éxito

/**
 * Property-based test para la redirección condicionada al resultado del
 * `LogoutControl` (Control_Cierre_Sesion).
 *
 * Feature: user-logout
 */

import { render, screen, cleanup, within, act } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { MemoryRouter } from 'react-router-dom';
import LogoutControl from '../LogoutControl';

// Aísla el componente de la navegación real de react-router. `navigate` se
// mockea para verificar si y solo cuándo se redirige a la `Ruta_Login`.
const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Aísla el componente del contexto de autenticación real. `logout` se mockea
// para inyectar el resultado como input (éxito | excepción | timeout).
const logoutMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    login: vi.fn(),
    logout: logoutMock,
  }),
}));

/** Duración del guardián de timeout de `performLogout` (Req 3.4). */
const LOGOUT_TIMEOUT_MS = 5000;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

/**
 * Resultado posible de la operación `logout`, inyectado como input de la
 * propiedad:
 * - `success`: `logout` finaliza correctamente (no lanza) → debe navegar.
 * - `exception`: `logout` propaga una excepción (borde defensivo) → no navega.
 * - `timeout`: `logout` no finaliza dentro del guardián de 5 s → no navega.
 */
type LogoutOutcome = 'success' | 'exception' | 'timeout';

const outcomeArb: fc.Arbitrary<LogoutOutcome> = fc.constantFrom(
  'success',
  'exception',
  'timeout'
);

describe("Feature: user-logout, Property 4: navigate('/login') ocurre si y solo si logout tuvo éxito", () => {
  /**
   * **Validates: Requirements 3.2, 3.4**
   *
   * Para todo resultado de la operación `logout` (éxito | excepción | timeout),
   * la navegación a la `Ruta_Login` (`/login`, con `replace`) ocurre si y solo
   * si `logout` finalizó con éxito:
   * - En éxito se navega exactamente una vez con `{ replace: true }` (Req 3.2).
   * - Ante fallo o expiración del guardián de 5 s no se navega, el
   *   `Dialogo_Confirmacion` queda cerrado y se muestra un mensaje de error,
   *   permaneciendo el usuario en la ruta actual (Req 3.4).
   */
  it("navigate('/login', { replace: true }) ocurre si y solo si logout tuvo éxito", async () => {
    await fc.assert(
      fc.asyncProperty(outcomeArb, async (outcome) => {
        cleanup();
        vi.clearAllMocks();
        // Timers falsos para controlar el guardián de timeout de 5 s de forma
        // determinista en las 100 iteraciones sin esperas reales.
        vi.useFakeTimers();

        // Configurar el mock de `logout` según el resultado inyectado.
        if (outcome === 'success') {
          // Éxito: `logout` síncrono que no lanza.
          logoutMock.mockImplementation(() => undefined);
        } else if (outcome === 'exception') {
          // Fallo: `logout` propaga una excepción (borde defensivo).
          logoutMock.mockImplementation(() => {
            throw new Error('logout failed');
          });
        } else {
          // Timeout: `logout` nunca resuelve, forzando la expiración del
          // guardián de 5 s de `performLogout`.
          logoutMock.mockImplementation(() => new Promise<void>(() => {}));
        }

        const { container } = render(
          <MemoryRouter>
            <LogoutControl variant="sidebar" />
          </MemoryRouter>
        );

        // El control (Control_Cierre_Sesion) es el primer botón renderizado por
        // el componente, fuera del diálogo. Con timers falsos se usan eventos
        // directos (fireEvent) en lugar de user-event (que depende de timers).
        const control = container.querySelector('button');
        expect(control).not.toBeNull();

        // Activar el control para abrir el `Dialogo_Confirmacion` (Req 2.1).
        act(() => {
          (control as HTMLButtonElement).click();
        });

        // Confirmar el cierre de sesión. `onConfirm` cierra el diálogo (Req 3.3),
        // marca el progreso (Req 1.4) y ejecuta `performLogout()`.
        const dialog = screen.getByRole('dialog');
        const confirmButton = within(dialog).getByRole('button', {
          name: 'Cerrar sesión',
        });
        act(() => {
          confirmButton.click();
        });

        // Avanzar el guardián de timeout y drenar las microtareas pendientes de
        // `performLogout` (que es async). Para el caso `success`/`exception`,
        // `Promise.race` ya resolvió al drenar las microtareas; para `timeout`,
        // avanzar 5 s dispara la rama de expiración del guardián. Las
        // actualizaciones de estado resultantes se aplican dentro del `act`, por
        // lo que tras salir del `act` los asserts observan el estado final sin
        // necesidad de `waitFor` (evitando su polling basado en timers falsos).
        await act(async () => {
          await vi.advanceTimersByTimeAsync(LOGOUT_TIMEOUT_MS);
        });

        // El diálogo debe quedar cerrado en todos los resultados (Req 3.3, 3.4).
        expect(screen.queryByRole('dialog')).toBeNull();

        if (outcome === 'success') {
          // Éxito: navega exactamente una vez a `/login` con `replace` (Req 3.2)
          // y no se muestra mensaje de error.
          expect(navigateMock).toHaveBeenCalledTimes(1);
          expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
          expect(screen.queryByRole('alert')).toBeNull();
        } else {
          // Fallo o timeout: no se navega (usuario permanece en la ruta actual)
          // y se muestra un mensaje de error accesible (Req 3.4).
          expect(navigateMock).not.toHaveBeenCalled();
          const alert = screen.getByRole('alert');
          expect(alert.textContent ?? '').not.toBe('');
        }

        cleanup();
        vi.useRealTimers();
        return true;
      }),
      { numRuns: 100 }
    );
  }, 120000);
});
