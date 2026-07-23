import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomePage from '../HomePage';
import type { DashboardEstadisticas } from '@/types/dashboard';

vi.mock('@/hooks/useDashboard');
vi.mock('@/components/GraficaEstadoEmpresas', () => ({
  default: ({ habilitadas, deshabilitadas }: { habilitadas: number; deshabilitadas: number }) => (
    <div data-testid="grafica-estado-empresas">
      Empresas: {habilitadas} hab / {deshabilitadas} deshab
    </div>
  ),
}));
vi.mock('@/components/GraficaEstadoProyectos', () => ({
  default: ({ habilitados, deshabilitados }: { habilitados: number; deshabilitados: number }) => (
    <div data-testid="grafica-estado-proyectos">
      Proyectos: {habilitados} hab / {deshabilitados} deshab
    </div>
  ),
}));
vi.mock('@/components/GraficaProyectosPorEmpresa', () => ({
  default: ({ datos }: { datos: unknown[] }) => (
    <div data-testid="grafica-proyectos-empresa">Barras: {datos.length} empresas</div>
  ),
}));

import { useDashboard } from '@/hooks/useDashboard';

const mockUseDashboard = vi.mocked(useDashboard);

const mockData: DashboardEstadisticas = {
  totalEmpresas: 25,
  empresasHabilitadas: 20,
  empresasDeshabilitadas: 5,
  totalProyectos: 87,
  proyectosHabilitados: 72,
  proyectosDeshabilitados: 15,
  proyectosPorEmpresa: [
    { nombreEmpresa: 'Empresa ABC', cantidadProyectos: 12 },
    { nombreEmpresa: 'Empresa XYZ', cantidadProyectos: 8 },
  ],
};

describe('HomePage (DashboardPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Validates: Requirement 6.1**
   * WHILE el Dashboard está obteniendo datos, mostrar indicador de carga.
   */
  describe('Estado de carga', () => {
    it('muestra el indicador de carga cuando loading es true', () => {
      mockUseDashboard.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        retry: vi.fn(),
        retryCount: 0,
        maxRetriesReached: false,
      });

      render(<HomePage />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText('Cargando estadísticas')).toBeInTheDocument();
    });

    it('no muestra las tarjetas ni gráficas mientras carga', () => {
      mockUseDashboard.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        retry: vi.fn(),
        retryCount: 0,
        maxRetriesReached: false,
      });

      render(<HomePage />);

      expect(screen.queryByText('Total Empresas')).not.toBeInTheDocument();
      expect(screen.queryByText('Dashboard de Estadísticas')).not.toBeInTheDocument();
    });
  });

  /**
   * **Validates: Requirements 6.2, 6.3**
   * Si la solicitud falla, mostrar mensaje de error con botón de reintento.
   */
  describe('Estado de error', () => {
    it('muestra el mensaje de error cuando hay un error', () => {
      mockUseDashboard.mockReturnValue({
        data: null,
        loading: false,
        error: 'No se pudieron cargar las estadísticas. Por favor, intente nuevamente.',
        retry: vi.fn(),
        retryCount: 0,
        maxRetriesReached: false,
      });

      render(<HomePage />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText('No se pudieron cargar las estadísticas. Por favor, intente nuevamente.')
      ).toBeInTheDocument();
    });

    it('muestra botón de reintentar junto al mensaje de error', () => {
      mockUseDashboard.mockReturnValue({
        data: null,
        loading: false,
        error: 'Error de red',
        retry: vi.fn(),
        retryCount: 0,
        maxRetriesReached: false,
      });

      render(<HomePage />);

      const retryButton = screen.getByRole('button', { name: 'Reintentar' });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });

    it('deshabilita el botón de reintentar tras 3 fallos consecutivos', () => {
      mockUseDashboard.mockReturnValue({
        data: null,
        loading: false,
        error: 'Error persistente',
        retry: vi.fn(),
        retryCount: 3,
        maxRetriesReached: true,
      });

      render(<HomePage />);

      const retryButton = screen.getByRole('button', { name: 'Reintentar' });
      expect(retryButton).toBeDisabled();
      expect(screen.getByText('Por favor, intente de nuevo más tarde.')).toBeInTheDocument();
    });
  });

  /**
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   * Mostrar 4 TarjetaResumen con valores correctos cuando los datos están disponibles.
   */
  describe('Datos cargados - Tarjetas de resumen', () => {
    beforeEach(() => {
      mockUseDashboard.mockReturnValue({
        data: mockData,
        loading: false,
        error: null,
        retry: vi.fn(),
        retryCount: 0,
        maxRetriesReached: false,
      });
    });

    it('muestra el título del Dashboard', () => {
      render(<HomePage />);
      expect(screen.getByText('Dashboard de Estadísticas')).toBeInTheDocument();
    });

    it('muestra tarjeta con total de empresas (Req 2.1)', () => {
      render(<HomePage />);
      expect(screen.getByText('Total Empresas')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('muestra tarjeta con total de proyectos (Req 2.2)', () => {
      render(<HomePage />);
      expect(screen.getByText('Total Proyectos')).toBeInTheDocument();
      expect(screen.getByText('87')).toBeInTheDocument();
    });

    it('muestra tarjeta con empresas habilitadas (Req 2.3)', () => {
      render(<HomePage />);
      expect(screen.getByText('Empresas Habilitadas')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('muestra tarjeta con proyectos habilitados (Req 2.4)', () => {
      render(<HomePage />);
      expect(screen.getByText('Proyectos Habilitados')).toBeInTheDocument();
      expect(screen.getByText('72')).toBeInTheDocument();
    });

    it('renderiza exactamente 4 tarjetas de resumen', () => {
      const { container } = render(<HomePage />);
      const tarjetas = container.querySelectorAll('.tarjeta-resumen');
      expect(tarjetas).toHaveLength(4);
    });
  });

  /**
   * **Validates: Requirements 7.1, 7.2**
   * Layout responsivo: verificar que las clases CSS apropiadas se aplican.
   */
  describe('Layout responsivo', () => {
    beforeEach(() => {
      mockUseDashboard.mockReturnValue({
        data: mockData,
        loading: false,
        error: null,
        retry: vi.fn(),
        retryCount: 0,
        maxRetriesReached: false,
      });
    });

    it('aplica clase dashboard__tarjetas para el grid de tarjetas (Req 7.1)', () => {
      const { container } = render(<HomePage />);
      const tarjetasSection = container.querySelector('.dashboard__tarjetas');
      expect(tarjetasSection).toBeInTheDocument();
    });

    it('aplica clase dashboard__graficas para el grid de gráficas (Req 7.1)', () => {
      const { container } = render(<HomePage />);
      const graficasSection = container.querySelector('.dashboard__graficas');
      expect(graficasSection).toBeInTheDocument();
    });

    it('la tercera gráfica tiene clase --full para ocupar ancho completo', () => {
      const { container } = render(<HomePage />);
      const fullGrafica = container.querySelector('.dashboard__grafica--full');
      expect(fullGrafica).toBeInTheDocument();
    });

    it('el contenedor principal tiene clase dashboard', () => {
      const { container } = render(<HomePage />);
      expect(container.querySelector('.dashboard')).toBeInTheDocument();
    });
  });

  /**
   * Caso borde: data es null (sin loading ni error)
   */
  describe('Sin datos y sin estados', () => {
    it('no renderiza nada si data es null, loading false y error null', () => {
      mockUseDashboard.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        retry: vi.fn(),
        retryCount: 0,
        maxRetriesReached: false,
      });

      const { container } = render(<HomePage />);
      expect(container.innerHTML).toBe('');
    });
  });
});
