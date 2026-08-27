import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { tokenStorage } from '@/utils/tokenStorage';

/**
 * Pruebas de ejemplo del cableado del enrutado (`App.tsx`).
 *
 * `App` renderiza únicamente `<Routes>` (el router lo provee `main.tsx` en
 * producción), por lo que aquí se envuelve `App` en un `MemoryRouter` con
 * `initialEntries` para controlar la ruta de partida. El estado de
 * autenticación se controla sembrando o limpiando el JWT en el
 * `Almacen_Token_Cliente` (`tokenStorage` sobre `localStorage`).
 *
 * Cubren:
 * - Requirement 7.4: la ruta `/login` es accesible sin token.
 * - Requirement 7.5: un usuario autenticado que visita `/login` es redirigido
 *   a la ruta protegida por defecto (`/`).
 * - Requirement 7.1: un usuario sin token en una ruta protegida es redirigido a
 *   `/login` y el contenido protegido no se renderiza.
 */

// Sustituir las páginas/Layout protegidos por marcadores identificables. Así
// las pruebas se centran en el enrutado y no disparan la obtención de datos ni
// dependen de APIs del navegador (p. ej. `matchMedia` en `Layout`).
//
// La `LoginPage` NO se mockea: la redirección de un usuario autenticado que
// visita `/login` (Req 7.5) la implementa la propia `LoginPage`, por lo que
// sustituirla eliminaría el comportamiento bajo prueba. Se identifica por su
// encabezado "Iniciar sesión".
const PROTECTED_HOME_TEXT = 'CONTENIDO_HOME_PROTEGIDO';
const LOGIN_HEADING = 'Iniciar sesión';

vi.mock('@/components/Layout', async () => {
  const { Outlet } = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    default: () => (
      <div data-testid="layout-protegido">
        <Outlet />
      </div>
    ),
  };
});

vi.mock('@/pages/HomePage', () => ({
  default: () => <div>{PROTECTED_HOME_TEXT}</div>,
}));

vi.mock('@/pages/EmpresasPage', () => ({
  default: () => <div>CONTENIDO_EMPRESAS_PROTEGIDO</div>,
}));

vi.mock('@/pages/ProyectosPage', () => ({
  default: () => <div>CONTENIDO_PROYECTOS_PROTEGIDO</div>,
}));

/**
 * Codifica un objeto como segmento Base64URL (formato de los segmentos JWT).
 */
function base64UrlEncode(obj: unknown): string {
  return btoa(JSON.stringify(obj))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Construye un JWT (sin firma real) con expiración una hora en el futuro. Solo
 * importa la estructura de tres segmentos y el `exp`, que es lo que inspecciona
 * el `Guardia_Ruta` para decidir si el token está vigente.
 */
function buildValidToken(): string {
  const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
  const expSeconds = Math.floor(Date.now() / 1000) + 3600;
  const payload = base64UrlEncode({ sub: 'user', username: 'user', exp: expSeconds });
  return `${header}.${payload}.signature`;
}

function renderAppAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  );
}

describe('App routing', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  describe('Requirement 7.4: /login accesible sin token', () => {
    it('renderiza la LoginPage al navegar a /login sin token almacenado', () => {
      // Sin token en el almacén → la ruta pública debe mostrarse igualmente.
      renderAppAt('/login');

      expect(
        screen.getByRole('heading', { name: new RegExp(LOGIN_HEADING, 'i') })
      ).toBeInTheDocument();
      expect(screen.queryByText(PROTECTED_HOME_TEXT)).not.toBeInTheDocument();
    });
  });

  describe('Requirement 7.5: usuario autenticado en /login redirige a la ruta protegida por defecto', () => {
    it('redirige a la ruta protegida por defecto y no muestra el formulario de login', () => {
      // Token válido presente → visitar /login debe redirigir a `/` (Home).
      tokenStorage.set(buildValidToken());

      renderAppAt('/login');

      expect(screen.getByText(PROTECTED_HOME_TEXT)).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: new RegExp(LOGIN_HEADING, 'i') })
      ).not.toBeInTheDocument();
    });
  });

  describe('Requirement 7.1: usuario sin token en ruta protegida redirige a /login', () => {
    it('redirige a /login y no renderiza el contenido protegido de la ruta raíz', () => {
      // Sin token → el Guardia_Ruta debe redirigir a /login.
      renderAppAt('/');

      expect(
        screen.getByRole('heading', { name: new RegExp(LOGIN_HEADING, 'i') })
      ).toBeInTheDocument();
      expect(screen.queryByText(PROTECTED_HOME_TEXT)).not.toBeInTheDocument();
    });

    it('redirige a /login y no renderiza el contenido protegido de /empresas', () => {
      // Verifica también una ruta protegida anidada distinta de la raíz.
      renderAppAt('/empresas');

      expect(
        screen.getByRole('heading', { name: new RegExp(LOGIN_HEADING, 'i') })
      ).toBeInTheDocument();
      expect(screen.queryByText('CONTENIDO_EMPRESAS_PROTEGIDO')).not.toBeInTheDocument();
    });
  });
});
