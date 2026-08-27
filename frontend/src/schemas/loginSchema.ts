import { z } from 'zod';

/**
 * Validador_Login: esquema Zod para el Formulario_Login (Req 8.1-8.4).
 *
 * Reglas de negocio del cliente (más estrictas que la validación de entrada del
 * backend). Cada mensaje identifica el campo infractor en español:
 *
 * - `username` (Req 8.1, 8.4): se recorta (`trim`). Si queda vacío —campo
 *   ausente o compuesto solo por espacios— se exige como obligatorio; en caso
 *   contrario debe tener entre 3 y 50 caracteres.
 * - `password` (Req 8.2, 8.3): si está vacío se exige como obligatorio; en caso
 *   contrario debe tener entre 8 y 64 caracteres.
 */

const USERNAME_REQUERIDO = 'El nombre de usuario es obligatorio';
const USERNAME_RANGO = 'El nombre de usuario debe tener entre 3 y 50 caracteres';
const PASSWORD_REQUERIDA = 'La contraseña es obligatoria';
const PASSWORD_RANGO = 'La contraseña debe tener entre 8 y 64 caracteres';

const usernameSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    // Vacío o solo espacios (tras recortar) → obligatorio (Req 8.1).
    if (value.length === 0) {
      ctx.addIssue({ code: 'custom', message: USERNAME_REQUERIDO });
      return;
    }
    // Fuera del rango permitido → mensaje de rango (Req 8.4).
    if (value.length < 3 || value.length > 50) {
      ctx.addIssue({ code: 'custom', message: USERNAME_RANGO });
    }
  });

const passwordSchema = z.string().superRefine((value, ctx) => {
  // Vacío → obligatorio (Req 8.2).
  if (value.length === 0) {
    ctx.addIssue({ code: 'custom', message: PASSWORD_REQUERIDA });
    return;
  }
  // Fuera del rango permitido → mensaje de rango (Req 8.3).
  if (value.length < 8 || value.length > 64) {
    ctx.addIssue({ code: 'custom', message: PASSWORD_RANGO });
  }
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

/** Datos del formulario de inicio de sesión validados por `loginSchema`. */
export type LoginSchema = z.infer<typeof loginSchema>;
