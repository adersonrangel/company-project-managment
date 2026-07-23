/**
 * Property-based tests for validarProyectoForm
 *
 * Feature: add-proyecto-ui-form
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { validarCampos } from '../validarProyectoForm';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a YYYY-MM-DD string directly from year/month/day integers,
 * bypassing all timezone concerns.
 */
function buildDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Returns today as { year, month, day } in local time (matching validarCampos). */
function todayLocal(): { year: number; month: number; day: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

const NOMBRE_VALIDO = 'Proyecto Test';
const VALID_FECHA = '2024-01-15';

const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

// ---------------------------------------------------------------------------
// Property 1: Validación completa de nombre
// Validates: Requirements 4.1, 5.1, 5.2
// ---------------------------------------------------------------------------

describe('Feature: add-proyecto-ui-form, Property 1: Validación completa de nombre', () => {
  /**
   * Para cualquier cadena de texto, validarCampos debe retornar el error correcto
   * basado en la longitud trimmed del nombre:
   *   - trimmed.length === 0 → "El nombre es obligatorio"
   *   - trimmed.length === 1 → "El nombre debe tener al menos 2 caracteres"
   *   - trimmed.length > 100 → "El nombre no puede exceder 100 caracteres"
   *   - trimmed.length entre 2 y 100 (inclusive) → error.nombre === undefined
   *
   * Validates: Requirements 4.1, 5.1, 5.2
   */
  it('para cualquier string, retorna el error de nombre correcto según longitud trimmed', () => {
    fc.assert(
      fc.property(fc.string(), (nombre) => {
        const result = validarCampos({
          nombre,
          fechaHabilitacion: VALID_FECHA,
          estadoHabilitacion: true,
        });

        const trimmedLength = nombre.trim().length;

        if (trimmedLength === 0) {
          return result.nombre === 'El nombre es obligatorio';
        } else if (trimmedLength === 1) {
          return result.nombre === 'El nombre debe tener al menos 2 caracteres';
        } else if (trimmedLength > 100) {
          return result.nombre === 'El nombre no puede exceder 100 caracteres';
        } else {
          // trimmedLength between 2 and 100 inclusive → no error
          return result.nombre === undefined;
        }
      }),
      { numRuns: 100 }
    );
  });
});


// ---------------------------------------------------------------------------
// Property 2: Validación completa de fecha de habilitación
// Validates: Requirements 4.2, 5.3, 5.4, 5.5
// ---------------------------------------------------------------------------

describe('Feature: add-proyecto-ui-form, Property 2: Validación completa de fecha de habilitación', () => {
  /**
   * 2a. Fecha vacía → "La fecha de habilitación es obligatoria"
   *
   * **Validates: Requirements 4.2, 5.3**
   */
  it('empty string → obligatoria error', () => {
    fc.assert(
      fc.property(fc.constant(''), (fecha) => {
        const result = validarCampos({
          nombre: NOMBRE_VALIDO,
          fechaHabilitacion: fecha,
          estadoHabilitacion: true,
        });
        return result.fechaHabilitacion === 'La fecha de habilitación es obligatoria';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 2b. Strings arbitrarios (no vacíos) que NO son fechas YYYY-MM-DD válidas
   *     → "La fecha de habilitación debe ser una fecha válida"
   *
   * **Validates: Requirements 4.2, 5.3**
   */
  it('arbitrary non-date string → debe ser una fecha válida error', () => {
    const invalidDateStringArb = fc
      .string({ minLength: 1 })
      .filter((s) => {
        if (s.trim().length === 0) return false;
        const formatoRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!formatoRegex.test(s)) return true;
        const parts = s.split('-');
        const y = parseInt(parts[0]!, 10);
        const m = parseInt(parts[1]!, 10);
        const d = parseInt(parts[2]!, 10);
        const dateObj = new Date(y, m - 1, d);
        if (
          dateObj.getFullYear() !== y ||
          dateObj.getMonth() !== m - 1 ||
          dateObj.getDate() !== d
        ) {
          return true;
        }
        return false;
      });

    fc.assert(
      fc.property(invalidDateStringArb, (fecha) => {
        const result = validarCampos({
          nombre: NOMBRE_VALIDO,
          fechaHabilitacion: fecha,
          estadoHabilitacion: true,
        });
        return result.fechaHabilitacion === 'La fecha de habilitación debe ser una fecha válida';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 2c. Fechas reales anteriores a 2000-01-01
   *     → "La fecha de habilitación no puede ser anterior al año 2000"
   *
   * **Validates: Requirements 4.2, 5.4**
   */
  it('date before 2000-01-01 → no puede ser anterior al año 2000 error', () => {
    const beforeMinDateArb = fc
      .record({
        year: fc.integer({ min: 1900, max: 1999 }),
        month: fc.integer({ min: 1, max: 12 }),
      })
      .chain(({ year, month }) => {
        const maxDay = month === 2 && isLeap(year) ? 29 : DAYS_IN_MONTH[month]!;
        return fc
          .integer({ min: 1, max: maxDay })
          .map((day) => buildDateString(year, month, day));
      });

    fc.assert(
      fc.property(beforeMinDateArb, (fecha) => {
        const result = validarCampos({
          nombre: NOMBRE_VALIDO,
          fechaHabilitacion: fecha,
          estadoHabilitacion: true,
        });
        return (
          result.fechaHabilitacion === 'La fecha de habilitación no puede ser anterior al año 2000'
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 2d. Fechas más de 10 años en el futuro
   *     → "La fecha de habilitación no puede ser superior a 10 años en el futuro"
   *
   * **Validates: Requirements 4.2, 5.5**
   */
  it('date more than 10 years in the future → no puede ser superior a 10 años en el futuro error', () => {
    const { year: currentYear } = todayLocal();

    const afterMaxDateArb = fc
      .record({
        year: fc.integer({ min: currentYear + 11, max: currentYear + 20 }),
        month: fc.integer({ min: 1, max: 12 }),
      })
      .chain(({ year, month }) => {
        const maxDay = month === 2 && isLeap(year) ? 29 : DAYS_IN_MONTH[month]!;
        return fc
          .integer({ min: 1, max: maxDay })
          .map((day) => buildDateString(year, month, day));
      });

    fc.assert(
      fc.property(afterMaxDateArb, (fecha) => {
        const result = validarCampos({
          nombre: NOMBRE_VALIDO,
          fechaHabilitacion: fecha,
          estadoHabilitacion: true,
        });
        return (
          result.fechaHabilitacion ===
          'La fecha de habilitación no puede ser superior a 10 años en el futuro'
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 2e. Fechas válidas dentro del rango [2000-01-01 .. today + 10 years]
   *     → undefined (sin error)
   *
   * **Validates: Requirements 4.2, 5.3, 5.4, 5.5**
   *
   * Strategy: generate year in [2000, today.year+9] to stay safely in range.
   */
  it('valid date within range → no error (undefined)', () => {
    const { year: currentYear } = todayLocal();

    const validDateArb = fc
      .record({
        year: fc.integer({ min: 2000, max: currentYear + 9 }),
        month: fc.integer({ min: 1, max: 12 }),
      })
      .chain(({ year, month }) => {
        const maxDay = month === 2 && isLeap(year) ? 29 : DAYS_IN_MONTH[month]!;
        return fc
          .integer({ min: 1, max: maxDay })
          .map((day) => buildDateString(year, month, day));
      });

    fc.assert(
      fc.property(validDateArb, (fecha) => {
        const result = validarCampos({
          nombre: NOMBRE_VALIDO,
          fechaHabilitacion: fecha,
          estadoHabilitacion: true,
        });
        return result.fechaHabilitacion === undefined;
      }),
      { numRuns: 100 }
    );
  });
});
