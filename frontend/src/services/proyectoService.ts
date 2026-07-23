import api from './api';
import type { ProyectoListResponse, ProyectoResponse, CrearProyectoRequest, ActualizarProyectoRequest } from '@/types/proyecto';

export const proyectoService = {
  listar: async (empresaId: number): Promise<ProyectoListResponse[]> => {
    const { data } = await api.get<ProyectoListResponse[]>(`/empresas/${empresaId}/proyectos`);
    return data;
  },

  obtenerPorId: async (empresaId: number, proyectoId: number): Promise<ProyectoResponse> => {
    const { data } = await api.get<ProyectoResponse>(`/empresas/${empresaId}/proyectos/${proyectoId}`);
    return data;
  },

  crear: async (empresaId: number, request: CrearProyectoRequest): Promise<ProyectoResponse> => {
    const { data } = await api.post<ProyectoResponse>(`/empresas/${empresaId}/proyectos`, request, { timeout: 30000 });
    return data;
  },

  actualizar: async (empresaId: number, proyectoId: number, request: ActualizarProyectoRequest): Promise<ProyectoResponse> => {
    const { data } = await api.put<ProyectoResponse>(`/empresas/${empresaId}/proyectos/${proyectoId}`, request, { timeout: 30000 });
    return data;
  },

  eliminar: async (empresaId: number, proyectoId: number): Promise<void> => {
    await api.delete(`/empresas/${empresaId}/proyectos/${proyectoId}`);
  },
};
