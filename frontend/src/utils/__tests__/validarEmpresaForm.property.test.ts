import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validarCampos, EmpresaFormData } from '@/utils/validarEmpresaForm';

/**
 * Feature: add-empresa-ui-form
 * Property-based tests for validarCampos function
 */

describe('validarCampos - Property-Based Tests', () => {
  /**
   * Feature: add-empresa-ui-form, Property 1: Rechazo de campos con solo espacios en blanco
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  describe('Property 1: Rechazo de campos con solo espacios en blanco', () => {
    const whitespaceArb = fc
      .array(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v'), { minLength: 0, maxLength: 50 })
      .map((arr) => arr.join(''));

    it('nombre con solo espacios retorna error obligatorio', () => {
      fc.assert(
        fc.property(whitespaceArb, (ws) => {
          const formData: EmpresaFormData = {
            nombre: ws,
            identificacion: "NIT-123",
            direccion: 'Dirección válida 123',
            telefono: '1234567',
            estadoHabilitacion: true,
          };
          const errores = validarCampos(formData);
          expect(errores.nombre).toBe('El nombre es obligatorio');
        }),
        { numRuns: 100 }
      );
    });

    it('direccion con solo espacios retorna error obligatorio', () => {
      fc.assert(
        fc.property(whitespaceArb, (ws) => {
          const formData: EmpresaFormData = {
            nombre: 'Nombre válido',
            identificacion: "NIT-123",
            direccion: ws,
            telefono: '1234567',
            estadoHabilitacion: true,
          };
          const errores = validarCampos(formData);
          expect(errores.direccion).toBe('La dirección es obligatoria');
        }),
        { numRuns: 100 }
      );
    });

    it('telefono con solo espacios retorna error obligatorio', () => {
      fc.assert(
        fc.property(whitespaceArb, (ws) => {
          const formData: EmpresaFormData = {
            nombre: 'Nombre válido',
            identificacion: "NIT-123",
            direccion: 'Dirección válida 123',
            telefono: ws,
            estadoHabilitacion: true,
          };
          const errores = validarCampos(formData);
          expect(errores.telefono).toBe('El teléfono es obligatorio');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: add-empresa-ui-form, Property 2: Datos válidos pasan la validación
   * Validates: Requirements 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5
   */
  describe('Property 2: Datos válidos pasan la validación', () => {
    // Generator for valid nombre: 2-100 non-whitespace-only chars after trim
    const validNombreArb = fc
      .string({ minLength: 2, maxLength: 100 })
      .filter((s) => s.trim().length >= 2 && s.trim().length <= 100);

    // Generator for valid direccion: 5-200 non-whitespace-only chars after trim
    const validDireccionArb = fc
      .string({ minLength: 5, maxLength: 200 })
      .filter((s) => s.trim().length >= 5 && s.trim().length <= 200);

    // Generator for valid telefono: only digits/hyphens/spaces with 7-15 digits
    const validTelefonoArb = fc
      .integer({ min: 7, max: 15 })
      .chain((digitCount) => {
        const digitsArb = fc.array(
          fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
          { minLength: digitCount, maxLength: digitCount }
        );
        const separatorsArb = fc.array(
          fc.constantFrom('', '-', ' '),
          { minLength: digitCount - 1, maxLength: digitCount - 1 }
        );
        return fc.tuple(digitsArb, separatorsArb).map(([digits, seps]) => {
          let result = '';
          for (let i = 0; i < digits.length; i++) {
            result += digits[i];
            if (i < seps.length) result += seps[i];
          }
          return result;
        });
      });

    it('datos dentro de rangos válidos no producen errores', () => {
      fc.assert(
        fc.property(validNombreArb, validDireccionArb, validTelefonoArb, (nombre, direccion, telefono) => {
          const formData: EmpresaFormData = { nombre, identificacion: "NIT-123", direccion, telefono, estadoHabilitacion: true };
          const errores = validarCampos(formData);
          expect(errores.nombre).toBeUndefined();
          expect(errores.direccion).toBeUndefined();
          expect(errores.telefono).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: add-empresa-ui-form, Property 3: Validación simultánea de múltiples campos inválidos
   * Validates: Requirement 4.4
   */
  describe('Property 3: Validación simultánea de múltiples campos inválidos', () => {
    const validNombre = 'Empresa Válida';
    const validDireccion = 'Calle Principal 123';
    const validTelefono = '1234567';
    const invalidValue = '   '; // whitespace-only triggers "obligatorio"

    it('retorna exactamente N errores para N campos inválidos', () => {
      const fieldsArb = fc.subarray(
        ['nombre', 'direccion', 'telefono'] as const,
        { minLength: 1, maxLength: 3 }
      );

      fc.assert(
        fc.property(fieldsArb, (invalidFields) => {
          const formData: EmpresaFormData = {
            nombre: invalidFields.includes('nombre') ? invalidValue : validNombre,
            identificacion: "NIT-123",
            direccion: invalidFields.includes('direccion') ? invalidValue : validDireccion,
            telefono: invalidFields.includes('telefono') ? invalidValue : validTelefono,
            estadoHabilitacion: true,
          };

          const errores = validarCampos(formData);
          const errorCount = [errores.nombre, errores.direccion, errores.telefono].filter(
            (e) => e !== undefined
          ).length;

          expect(errorCount).toBe(invalidFields.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: add-empresa-ui-form, Property 4: Límites de longitud del nombre
   * Validates: Requirements 5.1, 5.2
   */
  describe('Property 4: Límites de longitud del nombre', () => {
    // Generator for too-short nombre (trimmed length = 1)
    const tooShortNombreArb = fc
      .string({ minLength: 1, maxLength: 1 })
      .filter((s) => s.trim().length === 1);

    // Generator for too-long nombre (trimmed length > 100)
    const tooLongNombreArb = fc
      .string({ minLength: 101, maxLength: 150 })
      .filter((s) => s.trim().length > 100);

    it('nombre con longitud < 2 retorna error de longitud mínima', () => {
      fc.assert(
        fc.property(tooShortNombreArb, (nombre) => {
          const formData: EmpresaFormData = {
            nombre,
            identificacion: "NIT-123",
            direccion: 'Dirección válida 123',
            telefono: '1234567',
            estadoHabilitacion: true,
          };
          const errores = validarCampos(formData);
          expect(errores.nombre).toBe('El nombre debe tener al menos 2 caracteres');
        }),
        { numRuns: 100 }
      );
    });

    it('nombre con longitud > 100 retorna error de longitud máxima', () => {
      fc.assert(
        fc.property(tooLongNombreArb, (nombre) => {
          const formData: EmpresaFormData = {
            nombre,
            identificacion: "NIT-123",
            direccion: 'Dirección válida 123',
            telefono: '1234567',
            estadoHabilitacion: true,
          };
          const errores = validarCampos(formData);
          expect(errores.nombre).toBe('El nombre no puede exceder 100 caracteres');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: add-empresa-ui-form, Property 5: Formato inválido de teléfono
   * Validates: Requirement 5.3
   */
  describe('Property 5: Formato inválido de teléfono', () => {
    // Generate strings that have at least one char that's not a digit, hyphen, or space
    const invalidTelefonoArb = fc
      .tuple(
        fc.array(
          fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', ' '),
          { minLength: 0, maxLength: 10 }
        ).map((a) => a.join('')),
        fc.string({ minLength: 1, maxLength: 1 }).filter((c) => !/[\d\s-]/.test(c)),
        fc.array(
          fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', ' '),
          { minLength: 0, maxLength: 10 }
        ).map((a) => a.join(''))
      )
      .map(([pre, invalidChar, post]) => pre + invalidChar + post)
      .filter((s) => s.trim().length > 0);

    it('teléfono con caracteres ilegales retorna error de formato', () => {
      fc.assert(
        fc.property(invalidTelefonoArb, (telefono) => {
          const formData: EmpresaFormData = {
            nombre: 'Nombre válido',
            identificacion: "NIT-123",
            direccion: 'Dirección válida 123',
            telefono,
            estadoHabilitacion: true,
          };
          const errores = validarCampos(formData);
          expect(errores.telefono).toBe('El teléfono solo puede contener números, guiones y espacios');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: add-empresa-ui-form, Property 6: Cantidad de dígitos del teléfono fuera de rango
   * Validates: Requirement 5.4
   */
  describe('Property 6: Cantidad de dígitos del teléfono fuera de rango', () => {
    // Generator for valid-format strings but with too few digits (1-6)
    const tooFewDigitsArb = fc
      .integer({ min: 1, max: 6 })
      .chain((digitCount) =>
        fc.tuple(
          fc.array(
            fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
            { minLength: digitCount, maxLength: digitCount }
          ),
          fc.array(fc.constantFrom('-', ' '), { minLength: 0, maxLength: 3 })
        ).map(([digits, seps]) => digits.join('') + seps.join(''))
      )
      .filter((s) => {
        const trimmed = s.trim();
        return trimmed.length > 0 && /^[\d\s-]+$/.test(trimmed);
      });

    // Generator for valid-format strings but with too many digits (16-25)
    const tooManyDigitsArb = fc
      .integer({ min: 16, max: 25 })
      .chain((digitCount) =>
        fc.tuple(
          fc.array(
            fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
            { minLength: digitCount, maxLength: digitCount }
          ),
          fc.array(fc.constantFrom('-', ' '), { minLength: 0, maxLength: 3 })
        ).map(([digits, seps]) => digits.join('') + seps.join(''))
      )
      .filter((s) => {
        const trimmed = s.trim();
        return trimmed.length > 0 && /^[\d\s-]+$/.test(trimmed);
      });

    it('teléfono con menos de 7 dígitos retorna error de cantidad', () => {
      fc.assert(
        fc.property(tooFewDigitsArb, (telefono) => {
          const formData: EmpresaFormData = {
            nombre: 'Nombre válido',
            identificacion: "NIT-123",
            direccion: 'Dirección válida 123',
            telefono,
            estadoHabilitacion: true,
          };
          const errores = validarCampos(formData);
          expect(errores.telefono).toBe('El teléfono debe tener entre 7 y 15 dígitos');
        }),
        { numRuns: 100 }
      );
    });

    it('teléfono con más de 15 dígitos retorna error de cantidad', () => {
      fc.assert(
        fc.property(tooManyDigitsArb, (telefono) => {
          const formData: EmpresaFormData = {
            nombre: 'Nombre válido',
            identificacion: "NIT-123",
            direccion: 'Dirección válida 123',
            telefono,
            estadoHabilitacion: true,
          };
          const errores = validarCampos(formData);
          expect(errores.telefono).toBe('El teléfono debe tener entre 7 y 15 dígitos');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: add-empresa-ui-form, Property 7: Límites de longitud de la dirección
   * Validates: Requirement 5.5
   */
  describe('Property 7: Límites de longitud de la dirección', () => {
    // Generator for too-short direccion (trimmed length 1-4)
    const tooShortDireccionArb = fc
      .integer({ min: 1, max: 4 })
      .chain((len) =>
        fc.string({ minLength: len, maxLength: len }).filter((s) => s.trim().length >= 1 && s.trim().length <= 4)
      );

    // Generator for too-long direccion (trimmed length > 200)
    const tooLongDireccionArb = fc
      .string({ minLength: 201, maxLength: 250 })
      .filter((s) => s.trim().length > 200);

    it('direccion con longitud < 5 retorna error de longitud', () => {
      fc.assert(
        fc.property(tooShortDireccionArb, (direccion) => {
          const formData: EmpresaFormData = {
            nombre: 'Nombre válido',
            identificacion: "NIT-123",
            direccion,
            telefono: '1234567',
            estadoHabilitacion: true,
          };
          const errores = validarCampos(formData);
          expect(errores.direccion).toBe('La dirección debe tener entre 5 y 200 caracteres');
        }),
        { numRuns: 100 }
      );
    });

    it('direccion con longitud > 200 retorna error de longitud', () => {
      fc.assert(
        fc.property(tooLongDireccionArb, (direccion) => {
          const formData: EmpresaFormData = {
            nombre: 'Nombre válido',
            identificacion: "NIT-123",
            direccion,
            telefono: '1234567',
            estadoHabilitacion: true,
          };
          const errores = validarCampos(formData);
          expect(errores.direccion).toBe('La dirección debe tener entre 5 y 200 caracteres');
        }),
        { numRuns: 100 }
      );
    });
  });
});
