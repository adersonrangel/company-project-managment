import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { proyectoService } from '@/services/proyectoService';
import { validarCampos } from '@/utils/validarProyectoForm';
import type { ProyectoFormData, ProyectoFormErrors } from '@/utils/validarProyectoForm';
import type { ProyectoListResponse, ProyectoResponse } from '@/types/proyecto';

export interface UseProyectoFormOptions {
  modo: 'crear' | 'editar';
  empresaId: number;
  proyectoInicial?: ProyectoListResponse | null;
  onSuccess: (proyecto: ProyectoResponse) => void;
  onClose: () => void;
}

export interface UseProyectoFormReturn {
  formData: ProyectoFormData;
  errores: ProyectoFormErrors;
  errorServidor: string | null;
  submitting: boolean;
  handleChange: (campo: keyof ProyectoFormData, valor: string | boolean) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
}

const INITIAL_FORM_DATA: ProyectoFormData = {
  nombre: '',
  fechaHabilitacion: '',
  estadoHabilitacion: true,
};

function getInitialFormData(proyectoInicial?: ProyectoListResponse | null): ProyectoFormData {
  if (!proyectoInicial) {
    return { ...INITIAL_FORM_DATA };
  }
  return {
    nombre: proyectoInicial.nombre,
    fechaHabilitacion: proyectoInicial.fechaHabilitacion,
    estadoHabilitacion: proyectoInicial.estadoHabilitacion,
  };
}

/**
 * Hook personalizado para gestionar el estado y la lógica del formulario de proyecto.
 * Soporta modo creación y edición con validación, envío y manejo de errores.
 */
export function useProyectoForm(options: UseProyectoFormOptions): UseProyectoFormReturn {
  const { modo, empresaId, proyectoInicial, onSuccess, onClose } = options;

  const [formData, setFormData] = useState<ProyectoFormData>(() => getInitialFormData(proyectoInicial));
  const [errores, setErrores] = useState<ProyectoFormErrors>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Re-sync form data when proyectoInicial changes (e.g., switching from create to edit mode)
  useEffect(() => {
    setFormData(getInitialFormData(proyectoInicial));
    setErrores({});
    setErrorServidor(null);
  }, [proyectoInicial]);

  const handleChange = useCallback((campo: keyof ProyectoFormData, valor: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [campo]: valor };

      // Re-evaluate validation for the changed field to clear errors
      const erroresActuales = validarCampos(updated);
      setErrores((prevErrores) => {
        if (erroresActuales[campo as keyof ProyectoFormErrors]) {
          // Field still has an error — keep it as-is (don't update to avoid flicker during typing)
          return prevErrores;
        }
        // Field is now valid — clear its error
        const nuevosErrores = { ...prevErrores };
        delete nuevosErrores[campo as keyof ProyectoFormErrors];
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
      let proyecto: ProyectoResponse;

      const requestData = {
        nombre: formData.nombre,
        fechaHabilitacion: formData.fechaHabilitacion,
        estadoHabilitacion: formData.estadoHabilitacion,
      };

      if (modo === 'crear') {
        proyecto = await proyectoService.crear(empresaId, requestData);
      } else {
        const id = proyectoInicial!.id;
        proyecto = await proyectoService.actualizar(empresaId, id, requestData);
      }

      onSuccess(proyecto);
      onClose();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          setErrorServidor('La solicitud excedió el tiempo de espera. Intente nuevamente.');
        } else if (!error.response) {
          // Network error — no response received
          setErrorServidor('No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.');
        } else {
          const status = error.response.status;
          if (status === 400) {
            // Map server validation errors to fields
            const serverErrors = error.response.data?.errors;
            if (serverErrors && typeof serverErrors === 'object') {
              const mappedErrors: ProyectoFormErrors = {};
              let hasUnrecognized = false;

              for (const key of Object.keys(serverErrors)) {
                if (key === 'nombre') {
                  mappedErrors.nombre = serverErrors.nombre;
                } else if (key === 'fechaHabilitacion') {
                  mappedErrors.fechaHabilitacion = serverErrors.fechaHabilitacion;
                } else {
                  hasUnrecognized = true;
                }
              }

              setErrores(mappedErrors);

              if (hasUnrecognized) {
                setErrorServidor('Algunos campos contienen errores. Revise el formulario.');
              }
            }
          } else if (status === 404) {
            setErrorServidor('La empresa asociada no fue encontrada.');
          } else if (status === 409) {
            const mensaje = error.response.data?.mensaje;
            setErrorServidor(mensaje || 'Ya existe un proyecto con ese nombre.');
          } else if (status === 500) {
            setErrorServidor('Ocurrió un error en el servidor. Intente nuevamente.');
          }
        }
      } else if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'ECONNABORTED') {
        setErrorServidor('La solicitud excedió el tiempo de espera. Intente nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData, modo, empresaId, proyectoInicial, onSuccess, onClose]);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData(proyectoInicial));
    setErrores({});
    setErrorServidor(null);
    setSubmitting(false);
  }, [proyectoInicial]);

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
