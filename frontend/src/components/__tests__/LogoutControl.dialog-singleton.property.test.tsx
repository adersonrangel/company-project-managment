// Feature: user-logout, Property 3: Para N activaciones, existe a lo sumo un Dialogo_Confirmacion

/**
 * Property-based test para la unicidad del `Dialogo_Confirmacion` del
 * `LogoutControl` (Control_Cierre_Sesion).
 *
 * Feature: user-logout
 */

import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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

describe('Feature: user-logout, Property 3: Para N activaciones, existe a lo sumo un Dialogo_Confirmacion', () => {
  /**
   * **Validates: Requirements 2.2**
   *
   * Para toda secuencia de N (1..10) activaciones consecutivas del
   * `Control_Cierre_Sesion`, existe como máximo una instancia del
   * `Dialogo_Confirmacion` (elemento con `role="dialog"`) renderizada
   * simultáneamente en cualquier momento.
   */
  it('a lo sumo un elemento con role="dialog" existe tras N activaciones', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (n) => {
        cleanup();
        vi.clearAllMocks();

        const { container } = render(
          <MemoryRouter>
            <LogoutControl variant="sidebar" />
          </MemoryRouter>
        );

        // El control (Control_Cierre_Sesion) es el primer botón renderizado
        // por el componente, fuera del diálogo.
        const control = container.querySelector('button');
        expect(control).not.toBeNull();

        // N activaciones consecutivas del control. Tras cada activación se
        // verifica que a lo sumo exista un diálogo de confirmación (Req 2.2).
        for (let i = 0; i < n; i += 1) {
          fireEvent.click(control as HTMLElement);
          expect(screen.queryAllByRole('dialog').length).toBeLessThanOrEqual(1);
        }

        // Invariante final: a lo sumo un diálogo tras la secuencia completa.
        expect(screen.queryAllByRole('dialog').length).toBeLessThanOrEqual(1);

        cleanup();
        return true;
      }),
      { numRuns: 100 }
    );
  }, 120000);
});
