/**
 * Property-based tests for useProyectoForm hook
 *
 * Feature: add-proyecto-ui-form
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useProyectoForm } from '@/hooks/useProyectoForm';
import type { ProyectoListResponse } from '@/types/proyecto';

vi.mock('@/services/proyectoService', () => ({
  proyectoService: {
    crear: vi.fn().mockResolvedValue({ id: 1, nombre: '', fechaHabilitacion: '', estadoHabilitacion: true, empresaId: 1 }),
    actualizar: vi.fn().mockResolvedValue({ id: 1, nombre: '', fechaHabilitacion: '', estadoHabilitacion: true, empresaId: 1 }),
    listar: vi.fn().mockResolvedValue([]),
    obtenerPorId: vi.fn().mockResolvedValue({ id: 1, nombre: '', fechaHabilitacion: '', estadoHabilitacion: true, empresaId: 1 }),
    eliminar: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return { ...actual };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Known form field keys that the hook maps from server errors */
const KNOWN_KEYS = ['nombre', 'fechaHabilitacion'] as const;

/**
 * Generator for arbitrary identifier strings (valid JS identifiers that are NOT known keys).
 */
const unknownKeyArb = fc
  .stringMatching(/^[a-z][a-zA-Z0-9]{0,15}$/)
  .filter((s) => !KNOWN_KEYS.includes(s as typeof KNOWN_KEYS[number]));

/**
 * Generator for error message values (non-empty strings).
 */
const errorMessageArb = fc.string({ minLength: 1, maxLength: 100 });

/**
 * Generator for a dictionary of server errors with a mix of known and unknown keys.
 */
const serverErrorDictArb = fc.record({
  knownErrors: fc.dictionary(
    fc.constantFrom(...KNOWN_KEYS),
    errorMessageArb,
    { minKeys: 0, maxKeys: 2 }
  ),
  unknownErrors: fc.dictionary(
    unknownKeyArb,
    errorMessageArb,
    { minKeys: 0, maxKeys: 3 }
  ),
}).filter(({ knownErrors, unknownErrors }) => {
  // Ensure at least one key exists in the combined dictionary
  return Object.keys(knownErrors).length + Object.keys(unknownErrors).length > 0;
}).map(({ knownErrors, unknownErrors }) => ({
  ...knownErrors,
  ...unknownErrors,
}));

// ---------------------------------------------------------------------------
// Property 3: Mapeo de errores de servidor a campos del formulario
// Validates: Requirement 8.3
// ---------------------------------------------------------------------------

describe('Feature: add-proyecto-ui-form, Property 3: Mapeo de errores de servidor a campos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Para cualquier diccionario de errores retornado por el servidor (código 400):
   * - Las claves que coincidan con campos conocidos del formulario (nombre, fechaHabilitacion)
   *   deben mostrarse como errores debajo de sus campos respectivos (en result.current.errores)
   * - Las claves no reconocidas deben resultar en un error en el banner (errorServidor)
   * - Si TODAS las claves son conocidas, errorServidor debe ser null
   *
   * **Validates: Requirement 8.3**
   */
  it('maps known server error keys to field errors and unknown keys to errorServidor banner', async () => {
    const axios = await import('axios');
    const { proyectoService } = await import('@/services/proyectoService');
    const mockedProyectoService = vi.mocked(proyectoService);

    await fc.assert(
      fc.asyncProperty(serverErrorDictArb, async (serverErrors) => {
        vi.clearAllMocks();
        vi.spyOn(axios.default, 'isAxiosError').mockReturnValue(true);

        // Mock the service to reject with a 400 error containing the generated errors dict
        const axiosError = {
          isAxiosError: true,
          response: {
            status: 400,
            data: {
              errors: serverErrors,
            },
          },
          code: undefined,
          name: 'AxiosError',
          message: 'Request failed with status code 400',
        };
        mockedProyectoService.crear.mockRejectedValue(axiosError);

        const { result, unmount } = renderHook(() =>
          useProyectoForm({
            modo: 'crear',
            empresaId: 1,
            proyectoInicial: null,
            onSuccess: vi.fn(),
            onClose: vi.fn(),
          })
        );

        // Fill valid form data to pass client-side validation
        act(() => {
          result.current.handleChange('nombre', 'Test Proyecto');
          result.current.handleChange('fechaHabilitacion', '2024-06-15');
          result.current.handleChange('estadoHabilitacion', true);
        });

        // Trigger submit to hit the server
        await act(async () => {
          await result.current.handleSubmit();
        });

        // Classify keys
        const keys = Object.keys(serverErrors);
        const knownKeys = keys.filter((k) =>
          KNOWN_KEYS.includes(k as typeof KNOWN_KEYS[number])
        );
        const unknownKeys = keys.filter(
          (k) => !KNOWN_KEYS.includes(k as typeof KNOWN_KEYS[number])
        );

        // Known keys should appear as field errors
        for (const key of knownKeys) {
          const fieldKey = key as keyof typeof result.current.errores;
          if (result.current.errores[fieldKey] !== serverErrors[key]) {
            unmount();
            return false;
          }
        }

        // If there are unknown keys, errorServidor should not be null
        if (unknownKeys.length > 0) {
          if (result.current.errorServidor === null) {
            unmount();
            return false;
          }
        }

        // If ALL keys are known (no unknown keys), errorServidor should be null
        if (unknownKeys.length === 0) {
          if (result.current.errorServidor !== null) {
            unmount();
            return false;
          }
        }

        unmount();
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Reset de estado del formulario al cerrar
// Validates: Requirement 9.4
// ---------------------------------------------------------------------------

describe('Feature: add-proyecto-ui-form, Property 4: Reset de estado del formulario al cerrar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Para cualquier conjunto de datos ingresados en el formulario sin guardar:
   * Al cerrar el modal y reabrirlo en modo creación, los campos deben estar en su estado inicial:
   *   - nombre = ''
   *   - fechaHabilitacion = ''
   *   - estadoHabilitacion = true
   *
   * **Validates: Requirement 9.4**
   */
  it('create mode: after modifying fields with random data and calling resetForm, form returns to initial state', () => {
    const randomFormModificationArb = fc.record({
      nombre: fc.string({ minLength: 2, maxLength: 50 }),
      fechaHabilitacion: fc.constant('2024-03-15'),
      estadoHabilitacion: fc.boolean(),
    });

    fc.assert(
      fc.property(randomFormModificationArb, (modification) => {
        const { result } = renderHook(() =>
          useProyectoForm({
            modo: 'crear',
            empresaId: 1,
            proyectoInicial: null,
            onSuccess: vi.fn(),
            onClose: vi.fn(),
          })
        );

        // Modify fields with random data
        act(() => {
          result.current.handleChange('nombre', modification.nombre);
          result.current.handleChange('fechaHabilitacion', modification.fechaHabilitacion);
          result.current.handleChange('estadoHabilitacion', modification.estadoHabilitacion);
        });

        // Call resetForm (simulates closing and reopening the modal)
        act(() => {
          result.current.resetForm();
        });

        // Assert form data matches initial create mode state
        return (
          result.current.formData.nombre === '' &&
          result.current.formData.fechaHabilitacion === '' &&
          result.current.formData.estadoHabilitacion === true
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Para cualquier conjunto de datos ingresados en el formulario sin guardar:
   * Al reabrirlo en modo edición, los campos deben contener los datos originales del `proyectoInicial`
   *
   * **Validates: Requirement 9.4**
   */
  it('edit mode: after modifying fields with random data and calling resetForm, form returns to proyectoInicial values', () => {
    const validDateArb = fc.constantFrom(
      '2024-01-15',
      '2020-06-30',
      '2023-12-01',
      '2005-03-22',
      '2010-11-08'
    );

    const proyectoInicialArb = fc.record({
      id: fc.nat({ max: 10000 }),
      nombre: fc.string({ minLength: 2, maxLength: 50 }),
      fechaHabilitacion: validDateArb,
      estadoHabilitacion: fc.boolean(),
    });

    const randomModificationArb = fc.record({
      nombre: fc.string({ minLength: 2, maxLength: 50 }),
      fechaHabilitacion: fc.constant('2025-07-20'),
      estadoHabilitacion: fc.boolean(),
    });

    fc.assert(
      fc.property(
        proyectoInicialArb,
        randomModificationArb,
        (proyectoInicial: ProyectoListResponse, modification) => {
          const { result } = renderHook(() =>
            useProyectoForm({
              modo: 'editar',
              empresaId: 1,
              proyectoInicial,
              onSuccess: vi.fn(),
              onClose: vi.fn(),
            })
          );

          // Modify fields with random data
          act(() => {
            result.current.handleChange('nombre', modification.nombre);
            result.current.handleChange('fechaHabilitacion', modification.fechaHabilitacion);
            result.current.handleChange('estadoHabilitacion', modification.estadoHabilitacion);
          });

          // Call resetForm (simulates closing and reopening the modal)
          act(() => {
            result.current.resetForm();
          });

          // Assert form data matches the original proyectoInicial values
          return (
            result.current.formData.nombre === proyectoInicial.nombre &&
            result.current.formData.fechaHabilitacion === proyectoInicial.fechaHabilitacion &&
            result.current.formData.estadoHabilitacion === proyectoInicial.estadoHabilitacion
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
