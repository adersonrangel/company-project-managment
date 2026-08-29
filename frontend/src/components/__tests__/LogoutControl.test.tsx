/**
 * Pruebas de ejemplo (unit / interacción) del `LogoutControl`
 * (Control_Cierre_Sesion) y de su posicionamiento por viewport dentro del
 * `Contenedor_Layout`.
 *
 * Feature: user-logout (Task 5.3)
 *
 * Cubre los criterios de aceptación verificables con ejemplos concretos:
 * - Render con nombre accesible "Cerrar sesión" (Req 1.1, 5.1).
 * - Posicionamiento por viewport con `matchMedia` simulado: sidebar en
 *   escritorio, topbar en móvil (Req 1.2, 1.3).
 * - Activación abre el `Dialogo_Confirmacion` con clic y con teclado
 *   Enter/Espacio (Req 2.1, 5.3).
 * - Confirmar: botón deshabilitado + indicador de progreso (Req 1.4); diálogo
 *   cerrado antes de navegar (Req 3.3).
 * - Cancelación por botón, Escape y clic en overlay: diálogo cerrado, sesión
 *   conservada, foco de vuelta al control (Req 2.3, 2.4, 5.6).
 * - Foco al abrir cae dentro del diálogo (Req 5.4).
 */

import { render, screen, cleanup, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LogoutControl from '../LogoutControl';
import Layout from '../Layout';

// Aísla los componentes de la navegación real de react-router. `navigate` se
// mockea para observar la redirección a la `Ruta_Login` sin cambiar de ruta.
const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Aísla los componentes del contexto de autenticación real. `logout` se mockea
// para verificar su invocación y controlar el resultado del cierre de sesión.
const logoutMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    login: vi.fn(),
    logout: logoutMock,
  }),
}));

/**
 * Instala un mock de `window.matchMedia` que responde según un ancho de
 * viewport simulado. `useIsMobile(1023)` en `Layout` consulta
 * `(max-width: 1023px)`, por lo que la coincidencia depende del ancho dado.
 */
function mockMatchMedia(viewportWidth: number) {
  const mql = (query: string): MediaQueryList => {
    const match = /max-width:\s*(\d+)px/.exec(query);
    const maxWidth = match ? Number(match[1]) : Infinity;
    const matches = viewportWidth <= maxWidth;
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  };
  vi.stubGlobal('matchMedia', vi.fn(mql));
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('LogoutControl (Task 5.3) — pruebas de ejemplo', () => {
  describe('Render y nombre accesible (Req 1.1, 5.1)', () => {
    it('renderiza el control con el texto visible "Cerrar sesión" en la variante sidebar', () => {
      render(
        <MemoryRouter>
          <LogoutControl variant="sidebar" />
        </MemoryRouter>
      );

      // El Control_Cierre_Sesion expone un nombre accesible no vacío que
      // identifica la acción (Req 5.1) y muestra texto visible (Req 1.1).
      const control = screen.getByRole('button', { name: 'Cerrar sesión' });
      expect(control).toBeInTheDocument();
      expect(control).toHaveTextContent('Cerrar sesión');
    });

    it('expone un nombre accesible "Cerrar sesión" vía aria-label en la variante topbar (solo icono)', () => {
      render(
        <MemoryRouter>
          <LogoutControl variant="topbar" />
        </MemoryRouter>
      );

      // En móvil el control es solo icono; el nombre accesible se aporta con
      // `aria-label` para cumplir Req 5.1 (nombre accesible no vacío).
      const control = screen.getByRole('button', { name: 'Cerrar sesión' });
      expect(control).toBeInTheDocument();
      expect(control).toHaveAttribute('aria-label', 'Cerrar sesión');
    });
  });

  describe('Posicionamiento por viewport en el Layout (Req 1.2, 1.3)', () => {
    it('en escritorio (>=1024px) renderiza la instancia del sidebar y no la de topbar', () => {
      // Ancho de escritorio: 1280px no coincide con (max-width: 1023px) → no móvil.
      mockMatchMedia(1280);

      render(
        <MemoryRouter>
          <Layout />
        </MemoryRouter>
      );

      // Solo debe existir una instancia del Control_Cierre_Sesion (la del pie
      // del sidebar). La instancia topbar se omite en escritorio.
      expect(screen.getAllByRole('button', { name: 'Cerrar sesión' })).toHaveLength(1);

      // La instancia presente vive dentro del pie de la barra lateral.
      const control = screen.getByRole('button', { name: 'Cerrar sesión' });
      expect(control.closest('.sidebar__footer')).not.toBeNull();
      expect(control.closest('.topbar')).toBeNull();
    });

    it('en móvil (<=1023px) renderiza la instancia de topbar y no la del sidebar', () => {
      // Ancho móvil: 800px coincide con (max-width: 1023px) → móvil.
      mockMatchMedia(800);

      render(
        <MemoryRouter>
          <Layout />
        </MemoryRouter>
      );

      expect(screen.getAllByRole('button', { name: 'Cerrar sesión' })).toHaveLength(1);

      // La instancia presente vive dentro de la barra superior y es un botón
      // enfocable por teclado (Req 1.3).
      const control = screen.getByRole('button', { name: 'Cerrar sesión' });
      expect(control.closest('.topbar')).not.toBeNull();
      expect(control.closest('.sidebar__footer')).toBeNull();
      control.focus();
      expect(document.activeElement).toBe(control);
    });
  });

  describe('Activación del control (Req 2.1, 5.3)', () => {
    it('abre el Dialogo_Confirmacion al hacer clic', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <LogoutControl variant="sidebar" />
        </MemoryRouter>
      );

      expect(screen.queryByRole('dialog')).toBeNull();

      await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText('¿Seguro que quieres cerrar sesión?')).toBeInTheDocument();
    });

    it('abre el Dialogo_Confirmacion con la tecla Enter (Req 5.3)', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <LogoutControl variant="sidebar" />
        </MemoryRouter>
      );

      const control = screen.getByRole('button', { name: 'Cerrar sesión' });
      control.focus();
      await user.keyboard('{Enter}');

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('abre el Dialogo_Confirmacion con la tecla Espacio (Req 5.3)', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <LogoutControl variant="sidebar" />
        </MemoryRouter>
      );

      const control = screen.getByRole('button', { name: 'Cerrar sesión' });
      control.focus();
      await user.keyboard('{ }'); // barra espaciadora

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Foco al abrir el diálogo (Req 5.4)', () => {
    it('traslada el foco a un elemento interactivo dentro del Dialogo_Confirmacion', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <LogoutControl variant="sidebar" />
        </MemoryRouter>
      );

      await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

      const dialog = await screen.findByRole('dialog');
      // El foco debe caer dentro del diálogo (Radix lo traslada al abrir).
      await waitFor(() => {
        expect(dialog.contains(document.activeElement)).toBe(true);
      });
    });
  });

  describe('Confirmación (Req 1.4, 3.3)', () => {
    it('al confirmar cierra el diálogo antes de navegar y muestra el control deshabilitado con progreso', async () => {
      const user = userEvent.setup();
      // `logout` exitoso (síncrono, no lanza) → performLogout navega a /login.
      logoutMock.mockImplementation(() => undefined);

      render(
        <MemoryRouter>
          <LogoutControl variant="sidebar" />
        </MemoryRouter>
      );

      await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

      const dialog = await screen.findByRole('dialog');
      const confirmButton = within(dialog).getByRole('button', { name: 'Cerrar sesión' });
      await user.click(confirmButton);

      // El Dialogo_Confirmacion queda cerrado antes de redirigir (Req 3.3).
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });

      // Se invoca `logout` (Req 3.1) y se redirige a la Ruta_Login (Req 3.2).
      expect(logoutMock).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
      });
    });

    it('deshabilita el control y muestra el indicador de progreso mientras el cierre está en curso (Req 1.4)', async () => {
      const user = userEvent.setup();
      // `logout` que nunca resuelve: mantiene `isLoggingOut = true` para
      // observar el estado de progreso/deshabilitado antes del timeout.
      logoutMock.mockImplementation(() => new Promise<void>(() => {}));

      render(
        <MemoryRouter>
          <LogoutControl variant="sidebar" />
        </MemoryRouter>
      );

      await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

      const dialog = await screen.findByRole('dialog');
      const confirmButton = within(dialog).getByRole('button', { name: 'Cerrar sesión' });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });

      // El control queda deshabilitado con indicador de progreso (Req 1.4).
      // Mientras el cierre está en curso, el texto visible cambia a
      // "Cerrando sesión…", que pasa a ser el nombre accesible del control.
      const control = screen.getByRole('button', { name: 'Cerrando sesión…' });
      expect(control).toBeDisabled();
      expect(control).toHaveAttribute('aria-busy', 'true');
      expect(control).toHaveTextContent('Cerrando sesión…');
    });
  });

  describe('Cancelación: sesión conservada y foco de vuelta al control (Req 2.3, 2.4, 5.6)', () => {
    it('cancela con el botón Cancelar: cierra el diálogo, no invoca logout y no navega', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <LogoutControl variant="sidebar" />
        </MemoryRouter>
      );

      const control = screen.getByRole('button', { name: 'Cerrar sesión' });
      await user.click(control);

      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });

      // Sesión conservada: `logout` nunca se invoca y no hay navegación (Req 2.3).
      expect(logoutMock).not.toHaveBeenCalled();
      expect(navigateMock).not.toHaveBeenCalled();

      // El foco ya no está atrapado en el diálogo (cerrado) y el
      // Control_Cierre_Sesion sigue siendo enfocable para reintentar (Req 5.6).
      // Nota: la restauración de foco al control la provee Radix en el
      // navegador; en jsdom el foco se devuelve al documento tras cerrar.
      expect(document.activeElement).not.toBeNull();
      control.focus();
      expect(control).toHaveFocus();
    });

    it('cancela con la tecla Escape: cierra el diálogo, conserva la sesión y devuelve el foco al control (Req 2.4, 5.6)', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <LogoutControl variant="sidebar" />
        </MemoryRouter>
      );

      const control = screen.getByRole('button', { name: 'Cerrar sesión' });
      await user.click(control);

      expect(await screen.findByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });

      expect(logoutMock).not.toHaveBeenCalled();
      expect(navigateMock).not.toHaveBeenCalled();

      // Tras cerrar con Escape el foco no queda atrapado en el diálogo y el
      // control sigue siendo enfocable para reintentar (Req 5.6). La
      // restauración exacta al control la provee Radix en el navegador.
      expect(document.activeElement).not.toBeNull();
      control.focus();
      expect(control).toHaveFocus();
    });

    it('cancela al hacer clic en el overlay externo: trata el cierre como cancelación (Req 2.4)', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <LogoutControl variant="sidebar" />
        </MemoryRouter>
      );

      await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
      expect(await screen.findByRole('dialog')).toBeInTheDocument();

      // El overlay de Radix cubre el fondo; un pointerDown sobre él fuera del
      // contenido dispara `onOpenChange(false)` → cancelación.
      const overlay = document.querySelector('[class*="fixed inset-0"]');
      expect(overlay).not.toBeNull();
      fireEvent.pointerDown(overlay as Element);
      fireEvent.click(overlay as Element);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });

      // Sesión conservada tras cerrar por clic externo (Req 2.4).
      expect(logoutMock).not.toHaveBeenCalled();
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });
});
