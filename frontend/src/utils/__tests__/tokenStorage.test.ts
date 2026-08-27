import { describe, it, expect, afterEach, vi } from 'vitest';
import { tokenStorage } from '@/utils/tokenStorage';

/**
 * Pruebas de ejemplo para el Almacen_Token_Cliente (`tokenStorage`).
 *
 * Cubren:
 * - Requirement 5.1: el token store persiste el JWT (round-trip `set` -> `get`).
 * - Requirement 5.2: si `localStorage.setItem` lanza, `set` devuelve `false`
 *   y no queda ningún token almacenado (`get` -> null).
 */
describe('tokenStorage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Requirement 5.1: persistencia del JWT (round-trip set -> get)', () => {
    it('devuelve el mismo token que se guardó con set', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';

      const result = tokenStorage.set(token);

      expect(result).toBe(true);
      expect(tokenStorage.get()).toBe(token);
    });

    it('sobrescribe el token previo al llamar set de nuevo', () => {
      tokenStorage.set('token-inicial');
      tokenStorage.set('token-actualizado');

      expect(tokenStorage.get()).toBe('token-actualizado');
    });

    it('get devuelve null cuando no hay token almacenado', () => {
      expect(tokenStorage.get()).toBeNull();
    });
  });

  describe('Requirement 5.2: fallo de localStorage al guardar', () => {
    it('devuelve false y no persiste el token cuando setItem lanza', () => {
      const setItemSpy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new DOMException('QuotaExceededError');
        });

      const result = tokenStorage.set('token-que-no-se-guarda');

      expect(result).toBe(false);
      expect(setItemSpy).toHaveBeenCalled();

      // Con setItem restaurado, no debe quedar ningún token persistido.
      setItemSpy.mockRestore();
      expect(tokenStorage.get()).toBeNull();
    });
  });
});
