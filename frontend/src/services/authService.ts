import api from './api';
import type { LoginRequest, LoginResponse } from '@/types/auth';

/**
 * Servicio de autenticación del cliente.
 *
 * Encapsula las llamadas HTTP relacionadas con la autenticación siguiendo el
 * mismo patrón que `empresaService` (uso de la instancia `api` de axios y
 * retorno de `response.data`).
 */
export const authService = {
  /**
   * Envía las credenciales al endpoint `api/auth/login` y devuelve el JWT y su
   * vigencia (Req 8.5). La instancia `api` usa `baseURL: '/api'`, por lo que la
   * ruta relativa `/auth/login` resuelve a `api/auth/login`.
   */
  login: async (request: LoginRequest): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', request);
    return data;
  },
};
