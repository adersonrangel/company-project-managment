import { useState, useCallback } from 'react';
import axios from 'axios';
import { empresaService } from '@/services/empresaService';
import { validarCampos } from '@/utils/validarEmpresaForm';
import type { EmpresaFormData, EmpresaFormErrors } from '@/utils/validarEmpresaForm';
import type { Empresa } from '@/types/empresa';

export interface UseEmpresaFormOptions {
  modo: 'crear' | 'editar';
  empresaInicial?: Empresa | null;
  onSuccess: (empresa: Empresa) => void;
  onClose: () => void;
}

export interface UseEmpresaFormReturn {
  formData: EmpresaFormData;
  errores: EmpresaFormErrors;
  errorServidor: string | null;
  submitting: boolean;
  handleChange: (campo: keyof EmpresaFormData, valor: string | boolean) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
}

const INITIAL_FORM_DATA: EmpresaFormData = {
  nombre: '',
  identificacion: '',
  direccion: '',
  telefono: '',
  estadoHabilitacion: true,
};

function getInitialFormData(empresaInicial?: Empresa | null): EmpresaFormData {
  if (!empresaInicial) {
    return { ...INITIAL_FORM_DATA };
  }
  return {
    nombre: empresaInicial.nombre,
    identificacion: empresaInicial.identificacion,
    direccion: empresaInicial.direccion,
    telefono: empresaInicial.telefono,
    estadoHabilitacion: empresaInicial.estadoHabilitacion,
  };
}

/**
 * Hook personalizado para gestionar el estado y la lógica del formulario de empresa.
 * Soporta modo creación y edición con validación, envío y manejo de errores.
 */
export function useEmpresaForm(options: UseEmpresaFormOptions): UseEmpresaFormReturn {
  const { modo, empresaInicial, onSuccess, onClose } = options;

  const [formData, setFormData] = useState<EmpresaFormData>(() => getInitialFormData(empresaInicial));
  const [errores, setErrores] = useState<EmpresaFormErrors>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((campo: keyof EmpresaFormData, valor: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [campo]: valor };

      // Re-evaluate validation for the changed field to clear errors
      const erroresActuales = validarCampos(updated);
      setErrores((prevErrores) => {
        if (erroresActuales[campo as keyof typeof erroresActuales]) {
          // Field still has an error — keep it as-is (don't update to avoid flicker during typing)
          return prevErrores;
        }
        // Field is now valid — clear its error
        const nuevosErrores = { ...prevErrores };
        delete nuevosErrores[campo as keyof typeof nuevosErrores];
        return nuevosErrores;
      });

      return updated;
    });

    // Clear server error when user modifies any field
    setErrorServidor(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    // Run full validation
    const erroresValidacion = validarCampos(formData);

    // Check if there are any errors
    const hasErrors = Object.values(erroresValidacion).some((error) => error !== undefined);
    if (hasErrors) {
      setErrores(erroresValidacion);
      return;
    }

    setErrores({});
    setErrorServidor(null);
    setSubmitting(true);

    try {
      let empresa: Empresa;

      const requestData = {
        nombre: formData.nombre,
        identificacion: formData.identificacion,
        telefono: formData.telefono,
        direccion: formData.direccion,
        estadoHabilitacion: formData.estadoHabilitacion,
      };

      if (modo === 'crear') {
        empresa = await empresaService.crear(requestData, { timeout: 30000 });
      } else {
        const id = empresaInicial!.id;
        empresa = await empresaService.actualizar(id, requestData, { timeout: 30000 });
      }

      onSuccess(empresa);
      onClose();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 400) {
          // Map server validation errors to fields
          const serverErrors = error.response?.data?.errors;
          if (serverErrors && typeof serverErrors === 'object') {
            const mappedErrors: EmpresaFormErrors = {};
            if (serverErrors.nombre) mappedErrors.nombre = serverErrors.nombre;
            if (serverErrors.identificacion) mappedErrors.identificacion = serverErrors.identificacion;
            if (serverErrors.direccion) mappedErrors.direccion = serverErrors.direccion;
            if (serverErrors.telefono) mappedErrors.telefono = serverErrors.telefono;
            setErrores(mappedErrors);
          }
        } else if (status === 409) {
          setErrorServidor('Ya existe una empresa con ese nombre.');
        } else if (status === 500) {
          setErrorServidor('Ocurrió un error en el servidor. Intente nuevamente.');
        }

        if (error.code === 'ECONNABORTED') {
          setErrorServidor('La solicitud excedió el tiempo de espera.');
        }
      } else if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'ECONNABORTED') {
        setErrorServidor('La solicitud excedió el tiempo de espera.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData, modo, empresaInicial, onSuccess, onClose]);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData(empresaInicial));
    setErrores({});
    setErrorServidor(null);
    setSubmitting(false);
  }, [empresaInicial]);

  return {
    formData,
    errores,
    errorServidor,
    submitting,
    handleChange,
    handleSubmit,
    resetForm,
  };
}
