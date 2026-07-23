import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calcularPorcentaje, prepararDatosBarras, truncarNombre } from '@/utils/dashboardUtils';
import type { ProyectosPorEmpresa } from '@/types/dashboard';

/**
 * Feature: dashboard-estadisticas
 * Property-based tests for dashboardUtils functions
 */

describe('dashboardUtils - Property-Based Tests', () => {
  /**
   * Feature: dashboard-estadisticas, Property 3: Corrección del cálculo de porcentajes
   * Validates: Requirements 3.2, 4.2
   *
   * For any pair of non-negative integers (habilitados, deshabilitados) where the sum is > 0,
   * the calculated percentage of each segment SHALL sum approximately to 100% (±0.1 tolerance),
   * and each individual percentage SHALL be in the range [0, 100].
   */
  describe('Property 3: Corrección del cálculo de porcentajes', () => {
    const nonNegIntArb = fc.integer({ min: 0, max: 100_000 });

    it('porcentajes de habilitados + deshabilitados suman ~100% con tolerancia ±0.1', () => {
      fc.assert(
        fc.property(nonNegIntArb, nonNegIntArb, (habilitados, deshabilitados) => {
          const total = habilitados + deshabilitados;
          fc.pre(total > 0);

          const pctHabilitados = calcularPorcentaje(habilitados, total, 1);
          const pctDeshabilitados = calcularPorcentaje(deshabilitados, total, 1);

          const suma = pctHabilitados + pctDeshabilitados;
          expect(suma).toBeGreaterThanOrEqual(99.9);
          expect(suma).toBeLessThanOrEqual(100.1);
        }),
        { numRuns: 100 }
      );
    });

    it('cada porcentaje individual está en el rango [0, 100]', () => {
      fc.assert(
        fc.property(nonNegIntArb, nonNegIntArb, (habilitados, deshabilitados) => {
          const total = habilitados + deshabilitados;
          fc.pre(total > 0);

          const pctHabilitados = calcularPorcentaje(habilitados, total, 1);
          const pctDeshabilitados = calcularPorcentaje(deshabilitados, total, 1);

          expect(pctHabilitados).toBeGreaterThanOrEqual(0);
          expect(pctHabilitados).toBeLessThanOrEqual(100);
          expect(pctDeshabilitados).toBeGreaterThanOrEqual(0);
          expect(pctDeshabilitados).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: dashboard-estadisticas, Property 4: Preparación de datos de gráfica de barras (top-N + orden descendente)
   * Validates: Requirements 5.1, 5.4
   *
   * For any list of pairs (nombreEmpresa, cantidadProyectos) with more than 10 elements,
   * the preparation function SHALL return exactly 10 elements, ordered descending by
   * cantidadProyectos, and these SHALL be the 10 with the highest values from the original list.
   */
  describe('Property 4: Preparación de datos de gráfica de barras (top-N + orden descendente)', () => {
    const proyectosPorEmpresaArb = fc
      .array(
        fc.record({
          nombreEmpresa: fc.string({ minLength: 1, maxLength: 50 }),
          cantidadProyectos: fc.integer({ min: 0, max: 10_000 }),
        }),
        { minLength: 11, maxLength: 50 }
      );

    it('retorna exactamente 10 elementos cuando la lista tiene más de 10', () => {
      fc.assert(
        fc.property(proyectosPorEmpresaArb, (datos: ProyectosPorEmpresa[]) => {
          const resultado = prepararDatosBarras(datos, 10);
          expect(resultado).toHaveLength(10);
        }),
        { numRuns: 100 }
      );
    });

    it('resultado está ordenado de forma descendente por cantidadProyectos', () => {
      fc.assert(
        fc.property(proyectosPorEmpresaArb, (datos: ProyectosPorEmpresa[]) => {
          const resultado = prepararDatosBarras(datos, 10);

          for (let i = 0; i < resultado.length - 1; i++) {
            expect(resultado[i].cantidadProyectos).toBeGreaterThanOrEqual(
              resultado[i + 1].cantidadProyectos
            );
          }
        }),
        { numRuns: 100 }
      );
    });

    it('resultado contiene los 10 elementos con mayor cantidadProyectos de la lista original', () => {
      fc.assert(
        fc.property(proyectosPorEmpresaArb, (datos: ProyectosPorEmpresa[]) => {
          const resultado = prepararDatosBarras(datos, 10);

          // The minimum value in the result should be >= all values NOT in the result
          const minEnResultado = resultado[resultado.length - 1].cantidadProyectos;

          // Sort original descending to get the actual top 10 values
          const ordenadoOriginal = [...datos].sort(
            (a, b) => b.cantidadProyectos - a.cantidadProyectos
          );
          const top10Original = ordenadoOriginal.slice(0, 10);

          // The result values should match the top 10 values from the original
          const valoresResultado = resultado.map((r) => r.cantidadProyectos).sort((a, b) => b - a);
          const valoresTop10 = top10Original.map((r) => r.cantidadProyectos).sort((a, b) => b - a);

          expect(valoresResultado).toEqual(valoresTop10);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: dashboard-estadisticas, Property 5: Truncamiento de nombres
   * Validates: Requirements 5.2
   *
   * For any string, if its length exceeds 20 characters, the truncated result SHALL have
   * exactly 23 characters (20 + "...") and its first 20 characters SHALL match the first 20
   * of the original string. If the length is ≤ 20, the result SHALL be identical to the
   * original string.
   */
  describe('Property 5: Truncamiento de nombres', () => {
    const longStringArb = fc.string({ minLength: 21, maxLength: 200 });
    const shortStringArb = fc.string({ minLength: 0, maxLength: 20 });

    it('cadenas > 20 caracteres se truncan a exactamente 23 caracteres (20 + "...")', () => {
      fc.assert(
        fc.property(longStringArb, (nombre) => {
          const resultado = truncarNombre(nombre, 20);
          expect(resultado).toHaveLength(23);
        }),
        { numRuns: 100 }
      );
    });

    it('los primeros 20 caracteres del resultado coinciden con los primeros 20 del original', () => {
      fc.assert(
        fc.property(longStringArb, (nombre) => {
          const resultado = truncarNombre(nombre, 20);
          expect(resultado.slice(0, 20)).toBe(nombre.slice(0, 20));
        }),
        { numRuns: 100 }
      );
    });

    it('el resultado termina en "..." para cadenas largas', () => {
      fc.assert(
        fc.property(longStringArb, (nombre) => {
          const resultado = truncarNombre(nombre, 20);
          expect(resultado.endsWith('...')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('cadenas ≤ 20 caracteres se retornan sin modificar', () => {
      fc.assert(
        fc.property(shortStringArb, (nombre) => {
          const resultado = truncarNombre(nombre, 20);
          expect(resultado).toBe(nombre);
        }),
        { numRuns: 100 }
      );
    });
  });
});
