import api from './api';
import type { Empresa, CrearEmpresaRequest, ActualizarEmpresaRequest } from '@/types/empresa';

export const empresaService = {
  listar: async (): Promise<Empresa[]> => {
    const { data } = await api.get<Empresa[]>('/empresas');
    return data;
  },

  obtenerPorId: async (id: number): Promise<Empresa> => {
    const { data } = await api.get<Empresa>(`/empresas/${id}`);
    return data;
  },

  crear: async (request: CrearEmpresaRequest): Promise<Empresa> => {
    const { data } = await api.post<Empresa>('/empresas', request);
    return data;
  },

  actualizar: async (id: number, request: ActualizarEmpresaRequest): Promise<Empresa> => {
    const { data } = await api.put<Empresa>(`/empresas/${id}`, request);
    return data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/empresas/${id}`);
  },
};
