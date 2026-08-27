/**
 * Property-based test for ProtectedRoute (Guardia_Ruta).
 *
 * Feature: authentication-login-jwt
 */

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import fc from 'fast-check';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { tokenStorage } from '@/utils/tokenStorage';

const PROTECTED_TEXT = 'CONTENIDO_PROTEGIDO';
const LOGIN_TEXT = 'PAGINA_LOGIN';

/**
 * Codifica un objeto como segmento Base64URL, tal y como aparecen los
 * segmentos de un JWT (sin relleno `=`, con `-`/`_`).
 */
function base64UrlEncode(obj: unknown): string {
  const json = JSON.stringify(obj);
  return btoa(json).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Construye un JWT (sin firma real) con un claim `exp` dado, en segundos desde
 * época. Solo importa la estructura de tres segmentos y el payload, ya que
 * `ProtectedRoute` decodifica localmente el `exp` sin verificar la firma.
 */
function buildToken(expSeconds: number): string {
  const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
  const payload = base64UrlEncode({ sub: 'user', exp: expSeconds });
  return `${header}.${payload}.signature`;
}

/**
 * Renderiza `ProtectedRoute` dentro de un enrutador en memoria con una ruta
 * hija protegida y una ruta pública `/login`, ambas con contenido
 * identificable.
 */
function renderGuardia(): void {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>{PROTECTED_TEXT}</div>} />
        </Route>
        <Route path="/login" element={<div>{LOGIN_TEXT}</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  // Feature: authentication-login-jwt, Property 13: El Guardia_Ruta protege según la presencia de token
  describe('Feature: authentication-login-jwt, Property 13: El Guardia_Ruta protege según la presencia de token', () => {
    /**
     * **Validates: Requirements 7.1, 7.2**
     *
     * Para cualquier estado del `Almacen_Token_Cliente`, ProtectedRoute
     * renderiza el contenido protegido si y solo si existe un token válido
     * (no expirado). En ausencia de token, redirige a `/login` sin renderizar
     * el contenido protegido.
     */
    it('renderiza el contenido protegido si y solo si existe un token válido; en ausencia redirige a /login', () => {
      // Generador del estado del almacén de token:
      // - sin token (null): se representa dejando localStorage vacío,
      // - token vacío (''): presente pero sin valor → redirige,
      // - token válido: JWT con `exp` en el futuro → renderiza.
      const tokenStateArb = fc.oneof(
        // Ausencia de token.
        fc.constant<{ store: string | null; expectProtected: boolean }>({
          store: null,
          expectProtected: false,
        }),
        // Token vacío almacenado.
        fc.constant<{ store: string | null; expectProtected: boolean }>({
          store: '',
          expectProtected: false,
        }),
        // Token válido con expiración en el futuro (entre 1 minuto y ~muchos días).
        fc
          .integer({ min: 60, max: 60 * 60 * 24 * 30 })
          .map((deltaSeconds) => ({
            store: buildToken(Math.floor(Date.now() / 1000) + deltaSeconds),
            expectProtected: true,
          }))
      );

      fc.assert(
        fc.property(tokenStateArb, ({ store, expectProtected }) => {
          localStorage.clear();
          if (store !== null) {
            tokenStorage.set(store);
          }

          renderGuardia();

          if (expectProtected) {
            // Token válido presente → contenido protegido visible, sin login.
            expect(screen.queryByText(PROTECTED_TEXT)).not.toBeNull();
            expect(screen.queryByText(LOGIN_TEXT)).toBeNull();
          } else {
            // Sin token válido → redirige a /login, contenido protegido ausente.
            expect(screen.queryByText(PROTECTED_TEXT)).toBeNull();
            expect(screen.queryByText(LOGIN_TEXT)).not.toBeNull();
          }

          cleanup();
          localStorage.clear();
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
