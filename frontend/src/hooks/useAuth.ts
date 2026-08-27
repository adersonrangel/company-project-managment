import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/context/AuthContext';

/**
 * Hook de acceso al contexto de autenticación.
 *
 * Debe usarse dentro de un `AuthProvider`; en caso contrario lanza un error
 * para señalar el uso incorrecto en tiempo de desarrollo.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
