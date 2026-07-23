import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDashboard } from '../useDashboard';
import type { DashboardEstadisticas } from '@/types/dashboard';

vi.mock('@/services/dashboardService');

import { dashboardService } from '@/services/dashboardService';

const mockObtenerEstadisticas = vi.mocked(dashboardService.obtenerEstadisticas);

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

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Validates: Requirement 6.1
   * WHILE el Dashboard está obteniendo datos, mostrar indicador de carga.
   */
  it('inicia con loading=true, data=null, error=null', () => {
    mockObtenerEstadisticas.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useDashboard());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.retryCount).toBe(0);
    expect(result.current.maxRetriesReached).toBe(false);
  });

  /**
   * Validates: Requirement 6.1
   * Tras obtener datos exitosamente: loading=false, data poblada, error=null.
   */
  it('carga datos exitosamente: loading=false, data poblada, error=null', async () => {
    mockObtenerEstadisticas.mockResolvedValue(mockData);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  /**
   * Validates: Requirement 6.2
   * Si la solicitud falla: mostrar mensaje de error.
   */
  it('maneja error: loading=false, data=null, error con mensaje', async () => {
    mockObtenerEstadisticas.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(
      'No se pudieron cargar las estadísticas. Por favor, intente nuevamente.'
    );
  });

  /**
   * Validates: Requirement 6.3, 6.4
   * retry() incrementa retryCount y re-invoca la carga.
   */
  it('retry() incrementa retryCount y vuelve a cargar datos', async () => {
    mockObtenerEstadisticas.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.retryCount).toBe(0);

    // Configurar éxito en el siguiente intento
    mockObtenerEstadisticas.mockResolvedValueOnce(mockData);

    act(() => {
      result.current.retry();
    });

    expect(result.current.retryCount).toBe(1);
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  /**
   * Validates: Requirement 6.5
   * Tras 3 reintentos fallidos consecutivos, maxRetriesReached=true y retry() es no-op.
   */
  it('tras 3 reintentos fallidos, maxRetriesReached=true y retry() no hace nada', async () => {
    mockObtenerEstadisticas.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useDashboard());

    // Esperar la carga inicial (falla)
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Reintento 1
    act(() => {
      result.current.retry();
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.retryCount).toBe(1);

    // Reintento 2
    act(() => {
      result.current.retry();
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.retryCount).toBe(2);

    // Reintento 3
    act(() => {
      result.current.retry();
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.retryCount).toBe(3);
    expect(result.current.maxRetriesReached).toBe(true);

    // Intentar un 4to retry: no-op
    const callCountBefore = mockObtenerEstadisticas.mock.calls.length;

    act(() => {
      result.current.retry();
    });

    // retryCount no cambia, no se llama de nuevo al servicio
    expect(result.current.retryCount).toBe(3);
    expect(mockObtenerEstadisticas.mock.calls.length).toBe(callCountBefore);
  });
});
