import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '@/services/dashboardService';
import type { DashboardEstadisticas } from '@/types/dashboard';

const MAX_RETRIES = 3;

export interface UseDashboardResult {
  data: DashboardEstadisticas | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  retryCount: number;
  maxRetriesReached: boolean;
}

/**
 * Hook que gestiona el ciclo de vida de la carga de estadísticas del Dashboard.
 * Maneja estados de loading, data y error, con lógica de reintentos (máximo 3).
 */
export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardEstadisticas | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const maxRetriesReached = retryCount >= MAX_RETRIES;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const estadisticas = await dashboardService.obtenerEstadisticas();
      setData(estadisticas);
    } catch {
      setError('No se pudieron cargar las estadísticas. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const retry = useCallback(() => {
    if (maxRetriesReached) {
      return;
    }
    setRetryCount((prev) => prev + 1);
    fetchData();
  }, [maxRetriesReached, fetchData]);

  return {
    data,
    loading,
    error,
    retry,
    retryCount,
    maxRetriesReached,
  };
}
