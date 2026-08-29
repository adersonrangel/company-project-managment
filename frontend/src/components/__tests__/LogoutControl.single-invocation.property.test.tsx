// Feature: user-logout, Property 1: Para toda secuencia de activaciones y confirmaciones, logout se invoca a lo sumo una vez

/**
 * Property-based test para la invocación única de la operación `logout` del
 * `Contexto_Autenticacion` desde el `LogoutControl` (Control_Cierre_Sesion).
 *
 * Feature: user-logout
 */

import { render, screen, cleanup, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { MemoryRouter } from 'react-router-dom';
import LogoutControl from '../LogoutControl';

// Aísla el componente de la navegación real de react-router.
const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Aísla el componente del contexto de autenticación real.
const logoutMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    login: vi.fn(),
    logout: logoutMock,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Feature: user-logout, Property 1: Para toda secuencia de activaciones y confirmaciones, logout se invoca a lo sumo una vez', () => {
  /**
   * **Validates: Requirements 1.5, 3.1**
   *
   * Para toda secuencia de N (1..10) activaciones del `Control_Cierre_Sesion`
   * y M (1..10) confirmaciones intercaladas dentro de un mismo flujo de cierre
   * de sesión, la operación `logout` del `Contexto_Autenticacion` se invoca a
   * lo sumo una vez (exactamente una si M>=1) y `navigate` se invoca a lo sumo
   * una vez. Las activaciones adicionales mientras un cierre está en progreso
   * se ignoran (Req 1.5) y solo la confirmación invoca `logout` (Req 3.1).
   */
  it('logout se invoca a lo sumo una vez (exactamente una si M>=1) y navigate a lo sumo una vez', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        async (n, m) => {
          cleanup();
          vi.clearAllMocks();

          const user = userEvent.setup();
          const { container } = render(
            <MemoryRouter>
              <LogoutControl variant="sidebar" />
            </MemoryRouter>
          );

          // El control (Control_Cierre_Sesion) es el primer botón renderizado
          // por el componente, fuera del diálogo.
          const control = container.querySelector('button');
          expect(control).not.toBeNull();

          // Intercala N activaciones y M confirmaciones. Cada iteración activa
          // el control (abre el diálogo si procede) y, si hay un diálogo
          // abierto, pulsa la opción de confirmar. La primera confirmación
          // válida dispara el cierre de sesión; a partir de ahí `isLoggingOut`
          // deshabilita el control y descarta reaperturas/confirmaciones.
          const steps = Math.max(n, m);
          for (let i = 0; i < steps; i += 1) {
            if (i < n) {
              await user.click(control as HTMLElement);
            }
            if (i < m) {
              // El diálogo de Radix se monta en un portal de forma diferida;
              // se espera a que aparezca antes de intentar confirmar. Puede no
              // existir si el control ya está deshabilitado por un cierre en
              // progreso, en cuyo caso simplemente no hay confirmación posible.
              const dialog = screen.queryByRole('dialog');
              if (dialog) {
                const confirmButton = within(dialog).getByRole('button', {
                  name: 'Cerrar sesión',
                });
                await user.click(confirmButton);
              }
            }
          }

          // A lo sumo una invocación de `logout` (Req 1.5) y, como M>=1 y
          // siempre existe una activación válida (N>=1) que abre el diálogo
          // antes de la primera confirmación, exactamente una (Req 3.1).
          await waitFor(() => {
            expect(logoutMock).toHaveBeenCalledTimes(1);
          });
          // La redirección a la `Ruta_Login` ocurre a lo sumo una vez y con los
          // argumentos esperados.
          expect(navigateMock.mock.calls.length).toBeLessThanOrEqual(1);
          expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });

          cleanup();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);
});
