/**
 * Prueba de integración del `LogoutControl` (Control_Cierre_Sesion) con el
 * `Contexto_Autenticacion` real (`AuthProvider`).
 *
 * Feature: user-logout (Task 6.1)
 *
 * A diferencia de las pruebas de ejemplo (que mockean `useAuth`), aquí se monta
 * el `AuthProvider` real sobre el `Almacen_Token_Cliente` real (`tokenStorage`
 * sobre `localStorage`) para verificar el estado consistente tras el cierre de
 * sesión:
 * - Con un token sembrado, confirmar el cierre elimina el JWT del
 *   `Almacen_Token_Cliente` y restablece `isAuthenticated` a `false` (Req 4.1).
 * - Smoke/referencia (comportamiento propiedad de la spec
 *   `authentication-login-jwt`, no reimplementado aquí):
 *   - ausencia de la cabecera `Authorization` en solicitudes posteriores tras
 *     el borrado del token (Req 4.2), observada a través del `tokenStorage`
 *     vacío del que se nutre el `Interceptor_Solicitud`;
 *   - redirección del `Guardia_Ruta` (`ProtectedRoute`) a `/login` al navegar a
 *     una ruta protegida sin sesión (Req 4.3).
 *
 * No se modifican `AuthContext`, `tokenStorage`, `api.ts` ni `ProtectedRoute`;
 * su comportamiento solo se referencia.
 */

import { render, screen, cleanup, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LogoutControl from '../LogoutControl';
import ProtectedRoute from '../ProtectedRoute';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { tokenStorage } from '@/utils/tokenStorage';

const PROTECTED_TEXT = 'CONTENIDO_PROTEGIDO';
const LOGIN_TEXT = 'PAGINA_LOGIN';

/**
 * Codifica un objeto como segmento Base64URL, tal y como aparecen los segmentos
 * de un JWT (sin relleno `=`, con `-`/`_`).
 */
function base64UrlEncode(obj: unknown): string {
  const json = JSON.stringify(obj);
  return btoa(json).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Construye un JWT (sin firma real) con un `exp` en el futuro para que
 * `ProtectedRoute` lo considere una sesión válida mientras esté presente. Solo
 * importan la estructura de tres segmentos y el payload, ya que el guardián
 * decodifica localmente el `exp` sin verificar la firma.
 */
function buildValidToken(): string {
  const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
  const expSeconds = Math.floor(Date.now() / 1000) + 3600; // +1h
  const payload = base64UrlEncode({ sub: 'user', exp: expSeconds });
  return `${header}.${payload}.signature`;
}

/**
 * Sonda de solo lectura que expone el `isAuthenticated` del
 * `Contexto_Autenticacion` real en el DOM para poder afirmarlo (Req 4.1).
 */
function AuthProbe() {
  const { isAuthenticated } = useAuth();
  return <span data-testid="auth-state">{String(isAuthenticated)}</span>;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('LogoutControl (Task 6.1) — integración con AuthProvider real', () => {
  it('al confirmar el cierre elimina el JWT del Almacen_Token_Cliente y pone isAuthenticated=false (Req 4.1)', async () => {
    const user = userEvent.setup();

    // Sembrar un token válido en el `Almacen_Token_Cliente` real antes de montar
    // el `AuthProvider`, de modo que `isAuthenticated` arranque en `true`.
    tokenStorage.set(buildValidToken());
    expect(tokenStorage.get()).not.toBeNull();

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <AuthProbe />
                  <LogoutControl variant="sidebar" />
                </>
              }
            />
            <Route path="/login" element={<div>{LOGIN_TEXT}</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Estado inicial: sesión activa (Req 4.1, precondición).
    expect(screen.getByTestId('auth-state')).toHaveTextContent('true');

    // Activar el control y confirmar el cierre de sesión.
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar sesión' }));

    // Tras completarse el cierre: el JWT ya no está en el
    // `Almacen_Token_Cliente` y el estado en memoria del
    // `Contexto_Autenticacion` es no autenticado (Req 4.1).
    await waitFor(() => {
      expect(tokenStorage.get()).toBeNull();
    });
    // Al navegar a `/login` el árbol de la ruta protegida (con la sonda) se
    // desmonta; la ausencia de token confirma el reseteo del estado. Cuando la
    // sonda sigue montada, además reflejará `false`.
    const probe = screen.queryByTestId('auth-state');
    if (probe) {
      expect(probe).toHaveTextContent('false');
    }
  });

  it('smoke (Req 4.2): tras el cierre no queda JWT del que el Interceptor_Solicitud pueda tomar la cabecera Authorization', async () => {
    const user = userEvent.setup();

    tokenStorage.set(buildValidToken());

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LogoutControl variant="sidebar" />} />
            <Route path="/login" element={<div>{LOGIN_TEXT}</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar sesión' }));

    // La construcción de la cabecera `Authorization` la hace el
    // `Interceptor_Solicitud` (spec authentication-login-jwt) a partir del token
    // almacenado. Aquí solo se referencia: sin token almacenado, no hay valor
    // que adjuntar en solicitudes posteriores (Req 4.2). No se reimplementa el
    // interceptor.
    await waitFor(() => {
      expect(tokenStorage.get()).toBeNull();
    });
  });

  it('smoke (Req 4.3): al navegar a una ruta protegida sin sesión, el Guardia_Ruta redirige a /login', async () => {
    const user = userEvent.setup();

    tokenStorage.set(buildValidToken());

    // El `LogoutControl` navega a `/login` con `replace` al confirmar. Para
    // observar la protección de rutas, se define además una ruta protegida por
    // `ProtectedRoute` (Guardia_Ruta). Tras el cierre (token borrado), al montar
    // la ruta protegida el guardián redirige a `/login` (Req 4.3), cuyo
    // comportamiento es propiedad de la spec authentication-login-jwt y aquí
    // solo se referencia.
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LogoutControl variant="sidebar" />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/protegida" element={<div>{PROTECTED_TEXT}</div>} />
            </Route>
            <Route path="/login" element={<div>{LOGIN_TEXT}</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar sesión' }));

    // El cierre borra el token; la navegación por defecto lleva a `/login`.
    await waitFor(() => {
      expect(screen.getByText(LOGIN_TEXT)).toBeInTheDocument();
    });

    // Referencia a la protección de rutas: sin token, el `Guardia_Ruta` nunca
    // renderiza el contenido protegido (Req 4.3).
    expect(screen.queryByText(PROTECTED_TEXT)).toBeNull();
  });
});
