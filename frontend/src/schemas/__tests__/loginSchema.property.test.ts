/**
 * Property-based tests for loginSchema (Validador_Login).
 *
 * Feature: authentication-login-jwt
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { loginSchema } from '../loginSchema';

// ---------------------------------------------------------------------------
// Mensajes esperados (deben coincidir con loginSchema.ts)
// ---------------------------------------------------------------------------

const USERNAME_REQUERIDO = 'El nombre de usuario es obligatorio';
const USERNAME_RANGO = 'El nombre de usuario debe tener entre 3 y 50 caracteres';
const PASSWORD_REQUERIDA = 'La contraseña es obligatoria';
const PASSWORD_RANGO = 'La contraseña debe tener entre 8 y 64 caracteres';

/**
 * Devuelve el conjunto de mensajes asociados a un campo concreto tras un
 * `safeParse` fallido.
 */
function mensajesDeCampo(
  result: ReturnType<typeof loginSchema.safeParse>,
  campo: 'username' | 'password'
): string[] {
  if (result.success) return [];
  return result.error.issues
    .filter((issue) => issue.path[0] === campo)
    .map((issue) => issue.message);
}

// ---------------------------------------------------------------------------
// Property 14: El esquema de login es válido solo dentro de los límites
// Validates: Requirements 8.1, 8.2, 8.3, 8.4
// ---------------------------------------------------------------------------

// Feature: authentication-login-jwt, Property 14: El esquema de login es válido solo dentro de los límites
describe('Feature: authentication-login-jwt, Property 14: El esquema de login es válido solo dentro de los límites', () => {
  /**
   * Para cualquier par (username, password), loginSchema considera la entrada
   * válida si y solo si la longitud del username recortado ∈ [3, 50] Y la
   * longitud de la password ∈ [8, 64]. En cualquier otro caso, la entrada es
   * inválida y el mensaje reportado está asociado al campo infractor.
   *
   * Validates: Requirements 8.1, 8.2, 8.3, 8.4
   */
  it('es válido si y solo si username recortado ∈ [3,50] y password ∈ [8,64]', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (username, password) => {
        const result = loginSchema.safeParse({ username, password });

        const trimmedUsername = username.trim();
        const usernameValido =
          trimmedUsername.length >= 3 && trimmedUsername.length <= 50;
        const passwordValida = password.length >= 8 && password.length <= 64;
        const entradaValida = usernameValido && passwordValida;

        // Bicondicional: la validez del esquema coincide con la de los límites.
        if (result.success !== entradaValida) return false;

        if (entradaValida) {
          // Sin errores; nada más que comprobar.
          return true;
        }

        // Entrada inválida → debe existir un mensaje en el campo infractor,
        // con el mensaje correcto según la regla violada.
        const mensajesUsername = mensajesDeCampo(result, 'username');
        const mensajesPassword = mensajesDeCampo(result, 'password');

        if (!usernameValido) {
          const esperado =
            trimmedUsername.length === 0 ? USERNAME_REQUERIDO : USERNAME_RANGO;
          if (!mensajesUsername.includes(esperado)) return false;
        } else {
          // Username válido → no debe reportar error de username.
          if (mensajesUsername.length !== 0) return false;
        }

        if (!passwordValida) {
          const esperado =
            password.length === 0 ? PASSWORD_REQUERIDA : PASSWORD_RANGO;
          if (!mensajesPassword.includes(esperado)) return false;
        } else {
          // Password válida → no debe reportar error de password.
          if (mensajesPassword.length !== 0) return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Refuerzo dirigido: generadores que garantizan cubrir cada caso frontera
   * (username/password vacíos, por debajo y por encima de los límites, y
   * exactamente en los límites), evitando que el muestreo aleatorio omita
   * regiones estrechas del espacio de entrada.
   *
   * Validates: Requirements 8.1, 8.2, 8.3, 8.4
   */
  it('cubre explícitamente los casos frontera de cada campo', () => {
    // Caracter único no-espacio (para que trim no altere la longitud).
    const nonSpaceCharArb = fc
      .string({ minLength: 1, maxLength: 1 })
      .filter((c) => c.trim().length === 1);

    // username sin espacios de longitud controlada (para que trim no lo altere).
    const usernameCoreArb = (min: number, max: number) =>
      fc
        .array(nonSpaceCharArb, { minLength: min, maxLength: max })
        .map((chars) => chars.join(''));

    const usernameVacioArb = fc.oneof(
      fc.constant(''),
      fc
        .array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 5 })
        .map((c) => c.join(''))
    );
    const usernameCortoArb = usernameCoreArb(1, 2);
    const usernameLargoArb = usernameCoreArb(51, 60);
    const usernameValidoArb = usernameCoreArb(3, 50);

    const passwordVaciaArb = fc.constant('');
    const passwordCortaArb = fc.string({ minLength: 1, maxLength: 7 });
    const passwordLargaArb = fc.string({ minLength: 65, maxLength: 80 });
    const passwordValidaArb = fc.string({ minLength: 8, maxLength: 64 });

    const usernameArb = fc.oneof(
      usernameVacioArb,
      usernameCortoArb,
      usernameLargoArb,
      usernameValidoArb
    );
    const passwordArb = fc.oneof(
      passwordVaciaArb,
      passwordCortaArb,
      passwordLargaArb,
      passwordValidaArb
    );

    fc.assert(
      fc.property(usernameArb, passwordArb, (username, password) => {
        const result = loginSchema.safeParse({ username, password });

        const trimmedUsername = username.trim();
        const usernameValido =
          trimmedUsername.length >= 3 && trimmedUsername.length <= 50;
        const passwordValida = password.length >= 8 && password.length <= 64;
        const entradaValida = usernameValido && passwordValida;

        if (result.success !== entradaValida) return false;
        if (entradaValida) return true;

        const mensajesUsername = mensajesDeCampo(result, 'username');
        const mensajesPassword = mensajesDeCampo(result, 'password');

        if (!usernameValido) {
          const esperado =
            trimmedUsername.length === 0 ? USERNAME_REQUERIDO : USERNAME_RANGO;
          if (!mensajesUsername.includes(esperado)) return false;
        } else if (mensajesUsername.length !== 0) {
          return false;
        }

        if (!passwordValida) {
          const esperado =
            password.length === 0 ? PASSWORD_REQUERIDA : PASSWORD_RANGO;
          if (!mensajesPassword.includes(esperado)) return false;
        } else if (mensajesPassword.length !== 0) {
          return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
