import api from './api';
import type { Proyecto, CrearProyectoRequest, ActualizarProyectoRequest } from '@/types/proyecto';

export const proyectoService = {
  listar: async (empresaId: number): Promise<Proyecto[]> => {
    const { data } = await api.get<Proyecto[]>(`/empresas/${empresaId}/proyectos`);
    return data;
  },

  obtenerPorId: async (empresaId: number, proyectoId: number): Promise<Proyecto> => {
    const { data } = await api.get<Proyecto>(`/empresas/${empresaId}/proyectos/${proyectoId}`);
    return data;
  },

  crear: async (empresaId: number, request: CrearProyectoRequest): Promise<Proyecto> => {
    const { data } = await api.post<Proyecto>(`/empresas/${empresaId}/proyectos`, request);
    return data;
  },

  actualizar: async (empresaId: number, proyectoId: number, request: ActualizarProyectoRequest): Promise<Proyecto> => {
    const { data } = await api.put<Proyecto>(`/empresas/${empresaId}/proyectos/${proyectoId}`, request);
    return data;
  },

  eliminar: async (empresaId: number, proyectoId: number): Promise<void> => {
    await api.delete(`/empresas/${empresaId}/proyectos/${proyectoId}`);
  },
};
