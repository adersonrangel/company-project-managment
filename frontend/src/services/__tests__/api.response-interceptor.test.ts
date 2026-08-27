import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Pruebas de ejemplo del Interceptor_Respuesta de axios (`api`).
 *
 * Cubren el manejo de respuestas HTTP 401 en el cliente:
 * - Requirement 6.1: ante un 401, se elimina el JWT almacenado
 *   (`tokenStorage.clear()` es invocado).
 * - Requirement 6.2: tras el 401, se redirige a `/login` dentro de 2 segundos.
 * - Requirement 6.3: si `tokenStorage.clear()` lanza, el usuario sigue no
 *   autenticado y la redirección a `/login` ocurre igualmente.
 * - Requirement 6.4: el resultado de una solicitud en curso que recibe 401 se
 *   descarta; el interceptor RECHAZA la promesa (no la resuelve con datos).
 *
 * Se usan timers falsos de Vitest para controlar el `setTimeout` interno que
 * programa la redirección.
 */

// Mock del Almacen_Token_Cliente para poder verificar llamadas a `clear()` y,
// en el caso 6.3, forzar que lance una excepción.
vi.mock('../../utils/tokenStorage', () => ({
  tokenStorage: {
    get: vi.fn(() => null),
    set: vi.fn(() => true),
    clear: vi.fn(),
  },
}));

import api, { resetAuthRedirectState } from '../api';
import { tokenStorage } from '../../utils/tokenStorage';

/** Ventana máxima (ms) dentro de la cual debe ocurrir la redirección (Req 6.2). */
const REDIRECT_WINDOW_MS = 2000;

/**
 * Obtiene el handler `rejected` del Interceptor_Respuesta registrado en `api`.
 * Se busca el primer handler no nulo dentro de la lista interna de axios.
 */
function getRejectedHandler(): (error: unknown) => unknown {
  const handlers = (api.interceptors.response as unknown as {
    handlers: Array<{ rejected?: (error: unknown) => unknown } | null>;
  }).handlers;
  const entry = handlers.find((h) => h != null && typeof h.rejected === 'function');
  if (!entry || !entry.rejected) {
    throw new Error('No se encontró el handler rejected del interceptor de respuesta');
  }
  return entry.rejected;
}

describe('Interceptor_Respuesta: manejo de respuestas HTTP 401', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    resetAuthRedirectState();
    // Stub de window.location para capturar la redirección sin navegar de verdad.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    resetAuthRedirectState();
  });

  it('Req 6.1: al recibir un 401, invoca tokenStorage.clear()', async () => {
    const rejected = getRejectedHandler();
    const error = { response: { status: 401 } };

    await expect(rejected(error)).rejects.toBe(error);

    expect(tokenStorage.clear).toHaveBeenCalledTimes(1);
  });

  it('Req 6.2: tras el 401, redirige a /login dentro de 2 segundos', async () => {
    const rejected = getRejectedHandler();
    const error = { response: { status: 401 } };

    await expect(rejected(error)).rejects.toBe(error);

    // Antes de avanzar el reloj aún no debe haber redirigido.
    expect(window.location.href).toBe('');

    // Avanzar el reloj hasta la ventana máxima permitida (2000 ms).
    vi.advanceTimersByTime(REDIRECT_WINDOW_MS);

    expect(window.location.href).toBe('/login');
  });

  it('Req 6.3: si clear() lanza, el usuario sigue no autenticado y redirige a /login', async () => {
    (tokenStorage.clear as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('fallo al limpiar el token');
    });
    const rejected = getRejectedHandler();
    const error = { response: { status: 401 } };

    // La promesa se rechaza (no se resuelve con datos) pese al fallo de clear().
    await expect(rejected(error)).rejects.toBe(error);
    expect(tokenStorage.clear).toHaveBeenCalledTimes(1);

    // La redirección al estado no autenticado ocurre igualmente.
    vi.advanceTimersByTime(REDIRECT_WINDOW_MS);
    expect(window.location.href).toBe('/login');
  });

  it('Req 6.4: descarta la solicitud en curso rechazando la promesa (no la resuelve)', async () => {
    const rejected = getRejectedHandler();
    const error = { response: { status: 401 } };

    const result = rejected(error);

    // Debe ser una promesa rechazada con el mismo error, no un valor resuelto.
    expect(result).toBeInstanceOf(Promise);
    await expect(result).rejects.toBe(error);
  });
});
