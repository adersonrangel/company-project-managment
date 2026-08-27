// Feature: authentication-login-jwt, Property 12: Deduplicación de manejo de 401 concurrentes
// Validates: Requirements 6.5

/**
 * Pruebas basadas en propiedades para la deduplicación del manejo de respuestas
 * HTTP 401 concurrentes en el Interceptor_Respuesta de axios (`api`).
 *
 * Feature: authentication-login-jwt
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// El interceptor de respuesta llama a `tokenStorage.clear()`. Lo mockeamos para
// poder contar cuántas veces se invoca la limpieza del token (Req 6.1/6.5).
vi.mock('../../utils/tokenStorage', () => ({
  tokenStorage: {
    get: vi.fn(() => null),
    set: vi.fn(() => true),
    clear: vi.fn(),
  },
}));

import api, { resetAuthRedirectState } from '../api';
import { tokenStorage } from '../../utils/tokenStorage';

/**
 * Localiza el handler `rejected` del primer interceptor de respuesta registrado
 * en la instancia `api`. axios almacena los interceptores en `handlers`, donde
 * las entradas eliminadas pasan a ser `null`.
 */
function getRejectedHandler(): (error: unknown) => unknown {
  const handlers = (api.interceptors.response as unknown as {
    handlers: Array<{ rejected: (error: unknown) => unknown } | null>;
  }).handlers;
  const handler = handlers.find((h) => h != null && typeof h.rejected === 'function');
  if (!handler) {
    throw new Error('No se encontró un handler de respuesta con `rejected`.');
  }
  return handler.rejected;
}

describe('Feature: authentication-login-jwt, Property 12: Deduplicación de manejo de 401 concurrentes', () => {
  // Guardamos el descriptor original de `window.location` para restaurarlo.
  let originalLocation: PropertyDescriptor | undefined;
  let hrefSetter: ((value: string) => void) & { mock: { calls: unknown[][] } };

  beforeEach(() => {
    vi.useFakeTimers();
    originalLocation = Object.getOwnPropertyDescriptor(window, 'location');
  });

  afterEach(() => {
    vi.useRealTimers();
    // Restaurar `window.location` a su estado original de jsdom.
    if (originalLocation) {
      Object.defineProperty(window, 'location', originalLocation);
    }
    vi.clearAllMocks();
  });

  /**
   * Reinicia el estado del módulo y los espías para aislar cada iteración de la
   * propiedad: reinicia la bandera `isHandling401`, limpia el contador del mock
   * de `clear` y reinstala un setter espía sobre `window.location.href`.
   */
  function resetIteration(): void {
    resetAuthRedirectState();
    (tokenStorage.clear as ReturnType<typeof vi.fn>).mockClear();

    hrefSetter = vi.fn() as unknown as ((value: string) => void) & {
      mock: { calls: unknown[][] };
    };
    // Redefinimos `window.location` con un objeto configurable cuyo `href`
    // usa un setter espía. Producción hace `window.location.href = '/login'`.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        get href() {
          return '';
        },
        set href(value: string) {
          hrefSetter(value);
        },
      },
    });
  }

  /**
   * Para cualquier cantidad n ≥ 1 de respuestas HTTP 401 procesadas
   * concurrentemente por el Interceptor_Respuesta, la limpieza del token
   * (`tokenStorage.clear`) y la redirección a `/login` se ejecutan EXACTAMENTE
   * UNA VEZ, independientemente de n.
   *
   * Validates: Requirements 6.5
   */
  it('limpia el token y redirige a /login exactamente una vez ante n 401 concurrentes', async () => {
    const rejected = getRejectedHandler();

    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 20 }), async (n) => {
        resetIteration();

        // n respuestas 401 procesadas "concurrentemente": se invoca el handler
        // rejected n veces antes de avanzar los timers.
        const error401 = { response: { status: 401 } };
        const promises = Array.from({ length: n }, () => rejected(error401));

        // Req 6.4: cada solicitud en curso rechaza con el error original.
        const results = await Promise.allSettled(promises);
        for (const r of results) {
          if (r.status !== 'rejected') return false;
          if (r.reason !== error401) return false;
        }

        // Ejecutar la redirección programada vía setTimeout(..., 0).
        vi.runAllTimers();

        // La limpieza del token ocurre exactamente una vez.
        const clearCalls = (tokenStorage.clear as ReturnType<typeof vi.fn>).mock
          .calls.length;
        if (clearCalls !== 1) return false;

        // La redirección a '/login' ocurre exactamente una vez.
        if (hrefSetter.mock.calls.length !== 1) return false;
        if (hrefSetter.mock.calls[0]?.[0] !== '/login') return false;

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Comprobación dirigida (no propiedad): un único 401 también dispara la
   * limpieza y la redirección exactamente una vez. Sirve de sanity check del
   * arnés de prueba.
   *
   * Validates: Requirements 6.5
   */
  it('con un solo 401 limpia el token y redirige una vez', async () => {
    const rejected = getRejectedHandler();
    resetIteration();

    const error401 = { response: { status: 401 } };
    await expect(Promise.resolve(rejected(error401))).rejects.toBe(error401);

    vi.runAllTimers();

    expect((tokenStorage.clear as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    expect(hrefSetter).toHaveBeenCalledTimes(1);
    expect(hrefSetter).toHaveBeenCalledWith('/login');
  });
});
