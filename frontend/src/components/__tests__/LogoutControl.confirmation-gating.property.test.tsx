// Feature: user-logout, Property 2: Sin confirmación, logout nunca se invoca y el JWT permanece intacto

/**
 * Property-based test para el gating del borrado por confirmación del
 * `LogoutControl` (Control_Cierre_Sesion).
 *
 * Feature: user-logout
 */

import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { MemoryRouter } from 'react-router-dom';
import LogoutControl from '../LogoutControl';
import { tokenStorage } from '@/utils/tokenStorage';

// Aísla el componente de la navegación real de react-router.
const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Aísla el componente del contexto de autenticación real. `logout` se mockea
// para verificar que NUNCA se invoca sin una confirmación previa.
const logoutMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    login: vi.fn(),
    logout: logoutMock,
  }),
}));

/** JWT sembrado en el `Almacen_Token_Cliente` para comprobar que no se borra. */
const SEEDED_JWT = 'seeded.jwt.token';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

/**
 * Eventos de UI que NO constituyen una confirmación. Cada uno se aplica sobre
 * el `Control_Cierre_Sesion` o el `Dialogo_Confirmacion` según su naturaleza:
 * - `activate`: activar el control (clic) → abre el diálogo si procede (Req 2.1).
 * - `cancel`: pulsar el botón "Cancelar" del diálogo (Req 2.3).
 * - `escape`: cerrar el diálogo con la tecla Escape (Req 2.4).
 * - `overlay`: clic en el área externa (overlay) del diálogo (Req 2.4).
 * - `reopen`: intentar reabrir activando de nuevo el control (Req 2.2).
 */
type UiEvent = 'activate' | 'cancel' | 'escape' | 'overlay' | 'reopen';

const uiEventArb: fc.Arbitrary<UiEvent> = fc.constantFrom(
  'activate',
  'cancel',
  'escape',
  'overlay',
  'reopen'
);

describe('Feature: user-logout, Property 2: Sin confirmación, logout nunca se invoca y el JWT permanece intacto', () => {
  /**
   * **Validates: Requirements 2.3, 2.5**
   *
   * Para toda secuencia de eventos de UI que NO incluya una confirmación
   * (activaciones repetidas, cancelaciones, Escape, clic externo,
   * apertura/cierre del diálogo en cualquier orden), la operación `logout` del
   * `Contexto_Autenticacion` NUNCA se invoca y el JWT permanece intacto en el
   * `Almacen_Token_Cliente`, conservándose la sesión y la ruta actual.
   */
  it('para toda secuencia sin confirmación, logout nunca se invoca y el JWT permanece intacto', () => {
    fc.assert(
      fc.property(fc.array(uiEventArb, { minLength: 1, maxLength: 10 }), (events) => {
        cleanup();
        vi.clearAllMocks();
        localStorage.clear();

        // Sembrar un JWT en el `Almacen_Token_Cliente` antes de interactuar.
        tokenStorage.set(SEEDED_JWT);

        const { container } = render(
          <MemoryRouter>
            <LogoutControl variant="sidebar" />
          </MemoryRouter>
        );

        // El control (Control_Cierre_Sesion) es el primer botón renderizado por
        // el componente, fuera del diálogo.
        const control = container.querySelector('button');
        expect(control).not.toBeNull();

        // Aplicar la secuencia de eventos sin confirmación. Tras cada evento se
        // reafirma la invariante: `logout` nunca invocado y JWT intacto.
        for (const event of events) {
          switch (event) {
            case 'activate':
            case 'reopen': {
              // Activar/reabrir el control abre el diálogo si procede; nunca
              // dispara `logout` (Req 2.1, 2.2).
              fireEvent.click(control as HTMLElement);
              break;
            }
            case 'cancel': {
              // Pulsar el botón "Cancelar" del diálogo, si está abierto (Req 2.3).
              const dialog = screen.queryByRole('dialog');
              if (dialog) {
                const cancelButton = within(dialog).getByRole('button', {
                  name: 'Cancelar',
                });
                fireEvent.click(cancelButton);
              }
              break;
            }
            case 'escape': {
              // Cerrar el diálogo con Escape, si está abierto (Req 2.4). Radix
              // escucha el evento keydown a nivel de documento.
              if (screen.queryByRole('dialog')) {
                fireEvent.keyDown(document.body, {
                  key: 'Escape',
                  code: 'Escape',
                });
              }
              break;
            }
            case 'overlay': {
              // Clic en el área externa al diálogo (overlay), si está abierto
              // (Req 2.4). Radix trata la interacción con el exterior como un
              // cierre vía `onOpenChange(false)`. Se dispara el evento de
              // "pointer down outside" sobre el overlay, que Radix escucha para
              // cerrar el modal.
              const dialog = screen.queryByRole('dialog');
              if (dialog) {
                const overlay = document.querySelector(
                  '[data-state="open"].fixed.inset-0'
                );
                if (overlay) {
                  fireEvent.pointerDown(overlay);
                  fireEvent.click(overlay);
                } else {
                  // Fallback: cerrar por la ruta equivalente de cancelación.
                  fireEvent.keyDown(document.body, {
                    key: 'Escape',
                    code: 'Escape',
                  });
                }
              }
              break;
            }
          }

          // Invariante por paso: sin confirmación, `logout` nunca se invoca
          // (Req 2.5) y el JWT permanece intacto en el `Almacen_Token_Cliente`.
          expect(logoutMock).not.toHaveBeenCalled();
          expect(tokenStorage.get()).toBe(SEEDED_JWT);
        }

        // Invariante final tras la secuencia completa: sesión y token
        // preservados y ninguna navegación disparada (ruta actual conservada).
        expect(logoutMock).not.toHaveBeenCalled();
        expect(tokenStorage.get()).toBe(SEEDED_JWT);
        expect(navigateMock).not.toHaveBeenCalled();

        cleanup();
        localStorage.clear();
        return true;
      }),
      { numRuns: 100 }
    );
  }, 120000);
});
