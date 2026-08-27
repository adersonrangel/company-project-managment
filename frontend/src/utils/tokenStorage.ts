/** Clave de `localStorage` bajo la que se persiste el JWT en crudo. */
const TOKEN_KEY = 'auth_token';

/**
 * Almacen_Token_Cliente: persistencia del JWT sobre `localStorage`.
 *
 * `localStorage` sobrevive a recargas de página y reapertura de pestañas,
 * cumpliendo el requisito de persistencia de sesión (Req 5.1).
 */
export const tokenStorage = {
  /**
   * Recupera el JWT almacenado.
   * @returns el token guardado, o `null` si no existe o el acceso falla (Req 5.4).
   */
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Guarda el JWT. Captura errores de `localStorage` (p. ej. cuota excedida o
   * modo privado que bloquea la escritura) (Req 5.1, 5.2).
   * @returns `true` si el token se persistió; `false` en caso de fallo.
   */
  set(token: string): boolean {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Elimina el JWT almacenado (Req 5.5, 6.1).
   */
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignorar: el objetivo es dejar al usuario como no autenticado.
    }
  },
};
