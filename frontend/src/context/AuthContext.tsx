import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { authService } from '@/services/authService';
import { tokenStorage } from '@/utils/tokenStorage';
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

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Proveedor del estado de autenticación. Mantiene `isAuthenticated` sincronizado
 * con la presencia de un token en el `Almacen_Token_Cliente` y expone las
 * operaciones de `login` y `logout`.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => tokenStorage.get() !== null
  );

  const login = useCallback(async (request: LoginRequest): Promise<void> => {
    const { token } = await authService.login(request);

    // Persistir el JWT tras el login exitoso (Req 5.1).
    const persisted = tokenStorage.set(token);
    if (!persisted) {
      // La persistencia falló: descartar el token, mantener no autenticado y
      // propagar el error para que la UI muestre el mensaje (Req 5.2).
      tokenStorage.clear();
      setIsAuthenticated(false);
      throw new Error(STORAGE_ERROR_MESSAGE);
    }

    setIsAuthenticated(true);
  }, []);

  const logout = useCallback((): void => {
    // Eliminar el JWT para que ninguna solicitud posterior lleve la cabecera
    // `Authorization` (Req 5.5).
    tokenStorage.clear();
    setIsAuthenticated(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated, login, logout }),
    [isAuthenticated, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
