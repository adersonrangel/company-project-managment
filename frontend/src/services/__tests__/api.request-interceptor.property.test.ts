// Feature: authentication-login-jwt, Property 11: Adjunto condicional de la cabecera Bearer
// Validates: Requirements 5.3, 5.4, 5.5

/**
 * Property-based tests para el Interceptor_Solicitud de la instancia `api`.
 *
 * Feature: authentication-login-jwt
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';

// El interceptor lee el token mediante `tokenStorage.get()`; se mockea el
// módulo para poder controlar el estado del Almacen_Token_Cliente por caso.
vi.mock('../../utils/tokenStorage', () => ({
  tokenStorage: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
  },
}));

import api from '../api';
import { tokenStorage } from '../../utils/tokenStorage';

const mockedGet = vi.mocked(tokenStorage.get);

/**
 * Recupera el handler `fulfilled` del interceptor de solicitud registrado
 * sobre la instancia `api`.
 */
function getRequestInterceptorFulfilled(): (
  config: InternalAxiosRequestConfig
) => InternalAxiosRequestConfig {
  const handlers = (api.interceptors.request as unknown as {
    handlers: Array<{ fulfilled: (c: InternalAxiosRequestConfig) => InternalAxiosRequestConfig } | null>;
  }).handlers;
  const handler = handlers.find((h) => h != null);
  if (!handler) {
    throw new Error('No hay ningún interceptor de solicitud registrado en `api`.');
  }
  return handler.fulfilled;
}

/**
 * Construye una config de solicitud fresca cuya cabecera es una instancia de
 * `AxiosHeaders` (que es lo que el código de producción invoca vía `.set()`).
 */
function freshConfig(): InternalAxiosRequestConfig {
  return { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
}

// Feature: authentication-login-jwt, Property 11: Adjunto condicional de la cabecera Bearer
describe('Feature: authentication-login-jwt, Property 11: Adjunto condicional de la cabecera Bearer', () => {
  /**
   * Para cualquier estado del Almacen_Token_Cliente, la config producida por
   * el Interceptor_Solicitud incluye `Authorization: Bearer <token>` si y solo
   * si existe un token almacenado no vacío; en ausencia de token (null o cadena
   * vacía), la solicitud NO lleva cabecera `Authorization`.
   *
   * Validates: Requirements 5.3, 5.4, 5.5
   */
  it('adjunta Bearer si y solo si hay un token almacenado no vacío', () => {
    const fulfilled = getRequestInterceptorFulfilled();

    // Estado del almacen: string no vacío, cadena vacía, o null.
    const tokenStateArb = fc.oneof(
      fc.string({ minLength: 1 }).filter((s) => s.length > 0),
      fc.constant(''),
      fc.constant(null)
    );

    fc.assert(
      fc.property(tokenStateArb, (stored) => {
        mockedGet.mockReturnValue(stored);

        const config = fulfilled(freshConfig());
        const authHeader = config.headers.get('Authorization');

        const hayToken = typeof stored === 'string' && stored.length > 0;

        if (hayToken) {
          // Bicondicional (→): con token no vacío, la cabecera está presente
          // con el esquema `Bearer <token>`.
          //
          // Nota: `AxiosHeaders` normaliza (recorta) el valor almacenado, por
          // lo que se compara contra la forma recortada que persiste axios en
          // lugar de la cadena cruda; la propiedad esencial es la PRESENCIA de
          // la cabecera y su valor `Bearer <token>`.
          return authHeader === `Bearer ${stored}`.trim();
        }

        // Bicondicional (←): sin token, no debe existir cabecera Authorization.
        return authHeader == null;
      }),
      { numRuns: 200 }
    );
  });

  it('cubre explícitamente los casos frontera del almacen', () => {
    const fulfilled = getRequestInterceptorFulfilled();

    // Casos frontera: null, vacío, solo espacios (no vacío), token típico.
    const tokenStateArb = fc.oneof(
      fc.constant(null),
      fc.constant(''),
      fc.constant(' '),
      fc.constant('eyJhbGciOiJIUzI1NiJ9.payload.signature')
    );

    fc.assert(
      fc.property(tokenStateArb, (stored) => {
        mockedGet.mockReturnValue(stored);

        const config = fulfilled(freshConfig());
        const authHeader = config.headers.get('Authorization');

        const hayToken = typeof stored === 'string' && stored.length > 0;

        if (hayToken) {
          // `AxiosHeaders` recorta el valor almacenado; se compara contra la
          // forma recortada que persiste axios (la cabecera SÍ está presente).
          expect(authHeader).toBe(`Bearer ${stored}`.trim());
        } else {
          expect(authHeader == null).toBe(true);
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
