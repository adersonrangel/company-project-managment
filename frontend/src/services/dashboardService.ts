import api from './api';
import type { DashboardEstadisticas } from '@/types/dashboard';

export const dashboardService = {
  obtenerEstadisticas: async (): Promise<DashboardEstadisticas> => {
    const { data } = await api.get<DashboardEstadisticas>(
      '/dashboard/estadisticas',
      { timeout: 10000 }
    );
    return data;
  },
};
