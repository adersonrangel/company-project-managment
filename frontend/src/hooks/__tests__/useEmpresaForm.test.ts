import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEmpresaForm } from '@/hooks/useEmpresaForm';
import { empresaService } from '@/services/empresaService';
import type { Empresa } from '@/types/empresa';

vi.mock('@/services/empresaService');
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return { ...actual };
});

const mockedEmpresaService = vi.mocked(empresaService);

const empresaInicial: Empresa = {
  id: 42,
  nombre: 'Empresa Test',
  identificacion: 'NIT-123456',
  direccion: 'Calle Falsa 123',
  telefono: '1234567',
  estadoHabilitacion: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: null,
};

const validFormData = {
  nombre: 'Nueva Empresa',
  identificacion: 'NIT-789012',
  direccion: 'Avenida Siempre Viva 742',
  telefono: '9876543',
};

function createDefaultOptions(overrides = {}) {
  return {
    modo: 'crear' as const,
    empresaInicial: null,
    onSuccess: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

describe('useEmpresaForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty fields in create mode', () => {
      const { result } = renderHook(() =>
        useEmpresaForm(createDefaultOptions())
      );

      expect(result.current.formData).toEqual({
        nombre: '',
        direccion: '',
        telefono: '',
      });
      expect(result.current.errores).toEqual({});
      expect(result.current.errorServidor).toBeNull();
      expect(result.current.submitting).toBe(false);
    });

    it('should initialize with empresaInicial data in edit mode', () => {
      const { result } = renderHook(() =>
        useEmpresaForm(
          createDefaultOptions({
            modo: 'editar',
            empresaInicial,
          })
        )
      );

      expect(result.current.formData).toEqual({
        nombre: empresaInicial.nombre,
        direccion: empresaInicial.direccion,
        telefono: empresaInicial.telefono,
      });
    });
  });

  describe('handleSubmit — validation failure', () => {
    it('should NOT call service if validation fails', async () => {
      const { result } = renderHook(() =>
        useEmpresaForm(createDefaultOptions())
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockedEmpresaService.crear).not.toHaveBeenCalled();
      expect(mockedEmpresaService.actualizar).not.toHaveBeenCalled();
      expect(result.current.errores.nombre).toBeDefined();
      expect(result.current.errores.direccion).toBeDefined();
      expect(result.current.errores.telefono).toBeDefined();
    });
  });

  describe('handleSubmit — create mode success', () => {
    it('should call empresaService.crear() with correct data and invoke callbacks', async () => {
      const onSuccess = vi.fn();
      const onClose = vi.fn();
      const createdEmpresa: Empresa = {
        id: 1,
        ...validFormData,
        estadoHabilitacion: true,
        createdAt: '2024-06-01T00:00:00Z',
        updatedAt: null,
      };

      mockedEmpresaService.crear.mockResolvedValue(createdEmpresa);

      const { result } = renderHook(() =>
        useEmpresaForm(createDefaultOptions({ onSuccess, onClose }))
      );

      // Fill in valid form data
      act(() => {
        result.current.handleChange('nombre', validFormData.nombre);
        result.current.handleChange('direccion', validFormData.direccion);
        result.current.handleChange('telefono', validFormData.telefono);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockedEmpresaService.crear).toHaveBeenCalledWith(
        {
          nombre: validFormData.nombre,
          direccion: validFormData.direccion,
          telefono: validFormData.telefono,
        },
        { timeout: 30000 }
      );
      expect(onSuccess).toHaveBeenCalledWith(createdEmpresa);
      expect(onClose).toHaveBeenCalled();
      expect(result.current.submitting).toBe(false);
    });
  });

  describe('handleSubmit — edit mode success', () => {
    it('should call empresaService.actualizar() with id and correct data', async () => {
      const onSuccess = vi.fn();
      const onClose = vi.fn();
      const updatedEmpresa: Empresa = {
        ...empresaInicial,
        nombre: 'Nombre Actualizado',
        updatedAt: '2024-06-01T12:00:00Z',
      };

      mockedEmpresaService.actualizar.mockResolvedValue(updatedEmpresa);

      const { result } = renderHook(() =>
        useEmpresaForm(
          createDefaultOptions({
            modo: 'editar',
            empresaInicial,
            onSuccess,
            onClose,
          })
        )
      );

      // Modify the nombre field
      act(() => {
        result.current.handleChange('nombre', 'Nombre Actualizado');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockedEmpresaService.actualizar).toHaveBeenCalledWith(
        empresaInicial.id,
        {
          nombre: 'Nombre Actualizado',
          direccion: empresaInicial.direccion,
          telefono: empresaInicial.telefono,
        },
        { timeout: 30000 }
      );
      expect(onSuccess).toHaveBeenCalledWith(updatedEmpresa);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('handleSubmit — submitting state', () => {
    it('should set submitting to true during async operation and false after', async () => {
      let resolvePromise: (value: Empresa) => void;
      const promise = new Promise<Empresa>((resolve) => {
        resolvePromise = resolve;
      });
      mockedEmpresaService.crear.mockReturnValue(promise);

      const { result } = renderHook(() =>
        useEmpresaForm(createDefaultOptions())
      );

      act(() => {
        result.current.handleChange('nombre', validFormData.nombre);
        result.current.handleChange('direccion', validFormData.direccion);
        result.current.handleChange('telefono', validFormData.telefono);
      });

      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.handleSubmit();
      });

      // submitting should be true while awaiting
      expect(result.current.submitting).toBe(true);

      // Resolve the service call
      await act(async () => {
        resolvePromise!({
          id: 1,
          ...validFormData,
          estadoHabilitacion: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: null,
        });
        await submitPromise;
      });

      expect(result.current.submitting).toBe(false);
    });
  });

  describe('Error handling — HTTP 400', () => {
    it('should map server validation errors to field errors', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errors: {
              nombre: 'El nombre ya existe en el sistema',
              telefono: 'Formato de teléfono inválido',
            },
          },
        },
        code: undefined,
        name: 'AxiosError',
        message: 'Request failed with status code 400',
      };

      mockedEmpresaService.crear.mockRejectedValue(axiosError);

      // We need axios.isAxiosError to recognize our mock error
      const axios = await import('axios');
      vi.spyOn(axios.default, 'isAxiosError').mockReturnValue(true);

      const { result } = renderHook(() =>
        useEmpresaForm(createDefaultOptions())
      );

      act(() => {
        result.current.handleChange('nombre', validFormData.nombre);
        result.current.handleChange('direccion', validFormData.direccion);
        result.current.handleChange('telefono', validFormData.telefono);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errores.nombre).toBe('El nombre ya existe en el sistema');
      expect(result.current.errores.telefono).toBe('Formato de teléfono inválido');
      expect(result.current.submitting).toBe(false);
    });
  });

  describe('Error handling — HTTP 409', () => {
    it('should set errorServidor for conflict', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 409,
          data: { message: 'Conflict' },
        },
        code: undefined,
        name: 'AxiosError',
        message: 'Request failed with status code 409',
      };

      mockedEmpresaService.crear.mockRejectedValue(axiosError);

      const axios = await import('axios');
      vi.spyOn(axios.default, 'isAxiosError').mockReturnValue(true);

      const { result } = renderHook(() =>
        useEmpresaForm(createDefaultOptions())
      );

      act(() => {
        result.current.handleChange('nombre', validFormData.nombre);
        result.current.handleChange('direccion', validFormData.direccion);
        result.current.handleChange('telefono', validFormData.telefono);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errorServidor).toBe(
        'Ya existe una empresa con ese nombre.'
      );
      expect(result.current.submitting).toBe(false);
    });
  });

  describe('Error handling — HTTP 500', () => {
    it('should set errorServidor for server error', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
        },
        code: undefined,
        name: 'AxiosError',
        message: 'Request failed with status code 500',
      };

      mockedEmpresaService.crear.mockRejectedValue(axiosError);

      const axios = await import('axios');
      vi.spyOn(axios.default, 'isAxiosError').mockReturnValue(true);

      const { result } = renderHook(() =>
        useEmpresaForm(createDefaultOptions())
      );

      act(() => {
        result.current.handleChange('nombre', validFormData.nombre);
        result.current.handleChange('direccion', validFormData.direccion);
        result.current.handleChange('telefono', validFormData.telefono);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errorServidor).toBe(
        'Ocurrió un error en el servidor. Intente nuevamente.'
      );
      expect(result.current.submitting).toBe(false);
    });
  });

  describe('Error handling — timeout (ECONNABORTED)', () => {
    it('should set errorServidor for timeout', async () => {
      const axiosError = {
        isAxiosError: true,
        response: undefined,
        code: 'ECONNABORTED',
        name: 'AxiosError',
        message: 'timeout of 30000ms exceeded',
      };

      mockedEmpresaService.crear.mockRejectedValue(axiosError);

      const axios = await import('axios');
      vi.spyOn(axios.default, 'isAxiosError').mockReturnValue(true);

      const { result } = renderHook(() =>
        useEmpresaForm(createDefaultOptions())
      );

      act(() => {
        result.current.handleChange('nombre', validFormData.nombre);
        result.current.handleChange('direccion', validFormData.direccion);
        result.current.handleChange('telefono', validFormData.telefono);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errorServidor).toBe(
        'La solicitud excedió el tiempo de espera.'
      );
      expect(result.current.submitting).toBe(false);
    });
  });

  describe('handleChange — clears field error when field becomes valid', () => {
    it('should clear the error for a field when value becomes valid', async () => {
      const { result } = renderHook(() =>
        useEmpresaForm(createDefaultOptions())
      );

      // Submit with empty fields to generate errors
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errores.nombre).toBeDefined();

      // Fix the nombre field with a valid value
      act(() => {
        result.current.handleChange('nombre', 'Nombre Válido');
      });

      expect(result.current.errores.nombre).toBeUndefined();
    });
  });

  describe('handleChange — clears server error when any field is modified', () => {
    it('should clear errorServidor when any field changes', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
        },
        code: undefined,
        name: 'AxiosError',
        message: 'Request failed with status code 500',
      };

      mockedEmpresaService.crear.mockRejectedValue(axiosError);

      const axios = await import('axios');
      vi.spyOn(axios.default, 'isAxiosError').mockReturnValue(true);

      const { result } = renderHook(() =>
        useEmpresaForm(createDefaultOptions())
      );

      // Fill valid data and submit to trigger server error
      act(() => {
        result.current.handleChange('nombre', validFormData.nombre);
        result.current.handleChange('direccion', validFormData.direccion);
        result.current.handleChange('telefono', validFormData.telefono);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errorServidor).toBe(
        'Ocurrió un error en el servidor. Intente nuevamente.'
      );

      // Modify any field — should clear the server error
      act(() => {
        result.current.handleChange('nombre', 'Otro nombre');
      });

      expect(result.current.errorServidor).toBeNull();
    });
  });
});
