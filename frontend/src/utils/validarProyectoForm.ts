/**
 * Validación pura del formulario de proyecto.
 * No tiene efectos secundarios ni dependencias externas.
 */

export interface ProyectoFormData {
  nombre: string;
  fechaHabilitacion: string;
  estadoHabilitacion: boolean;
}

export interface ProyectoFormErrors {
  nombre?: string;
  fechaHabilitacion?: string;
}

/**
 * Valida todos los campos del formulario de proyecto simultáneamente.
 * Retorna un objeto con mensajes de error por cada campo inválido.
 * Si todos los campos son válidos, retorna un objeto sin propiedades definidas.
 */
export function validarCampos(formData: ProyectoFormData): ProyectoFormErrors {
  const errores: ProyectoFormErrors = {};

  // Validación de nombre
  errores.nombre = validarNombre(formData.nombre);

  // Validación de fecha de habilitación
  errores.fechaHabilitacion = validarFechaHabilitacion(formData.fechaHabilitacion);

  return errores;
}

function validarNombre(nombre: string): string | undefined {
  const trimmed = nombre.trim();

  if (trimmed.length === 0) {
    return 'El nombre es obligatorio';
  }

  if (trimmed.length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }

  if (trimmed.length > 100) {
    return 'El nombre no puede exceder 100 caracteres';
  }

  return undefined;
}

function validarFechaHabilitacion(fecha: string): string | undefined {
  if (fecha.trim().length === 0) {
    return 'La fecha de habilitación es obligatoria';
  }

  // Verificar formato YYYY-MM-DD
  const formatoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!formatoRegex.test(fecha)) {
    return 'La fecha de habilitación debe ser una fecha válida';
  }

  // Parsear componentes y verificar que la fecha sea real
  const parts = fecha.split('-');
  const year = parseInt(parts[0]!, 10);
  const month = parseInt(parts[1]!, 10);
  const day = parseInt(parts[2]!, 10);

  const dateObj = new Date(year, month - 1, day);

  // Verificar que los componentes reconstruyan la fecha original
  // Esto detecta fechas inexistentes como 2024-02-30
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return 'La fecha de habilitación debe ser una fecha válida';
  }

  // Verificar que no sea anterior a 2000-01-01
  const fechaMinima = new Date(2000, 0, 1);
  if (dateObj < fechaMinima) {
    return 'La fecha de habilitación no puede ser anterior al año 2000';
  }

  // Verificar que no sea más de 10 años en el futuro
  const hoy = new Date();
  const fechaMaxima = new Date(hoy.getFullYear() + 10, hoy.getMonth(), hoy.getDate());
  if (dateObj > fechaMaxima) {
    return 'La fecha de habilitación no puede ser superior a 10 años en el futuro';
  }

  return undefined;
}
