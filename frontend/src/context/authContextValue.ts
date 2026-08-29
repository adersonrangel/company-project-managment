import { createContext } from 'react';
import type { LoginRequest } from '@/types/auth';

/**
 * Mensaje de error que se expone cuando el token no puede persistirse en el
 * `Almacen_Token_Cliente` (Req 5.2).
 */
export const STORAGE_ERROR_MESSAGE =
  'No se pudo guardar la sesión. Vuelve a intentarlo.';

/**
 * Contrato del contexto de autenticación consumido por `useAuth`.
 */
export interface AuthContextValue {
  /** Indica si existe un JWT almacenado (Req 5.1, 5.4). */
  isAuthenticated: boolean;
  /**
   * Autentica al usuario: solicita el token, lo persiste vía `tokenStorage.set`
   * y actualiza el estado. Si la persistencia falla, descarta el token, mantiene
   * al usuario como no autenticado y lanza un error con `STORAGE_ERROR_MESSAGE`
   * (Req 5.1, 5.2).
   */
  login: (request: LoginRequest) => Promise<void>;
  /** Cierra la sesión eliminando el JWT almacenado (Req 5.5). */
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
