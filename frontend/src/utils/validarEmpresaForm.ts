/**
 * Validación pura del formulario de empresa.
 * No tiene efectos secundarios ni dependencias externas.
 */

export interface EmpresaFormData {
  nombre: string;
  identificacion: string;
  direccion: string;
  telefono: string;
  estadoHabilitacion: boolean;
}

export interface EmpresaFormErrors {
  nombre?: string;
  identificacion?: string;
  direccion?: string;
  telefono?: string;
}

/**
 * Valida todos los campos del formulario de empresa simultáneamente.
 * Retorna un objeto con mensajes de error por cada campo inválido.
 * Si todos los campos son válidos, retorna un objeto sin propiedades definidas.
 */
export function validarCampos(formData: EmpresaFormData): EmpresaFormErrors {
  const errores: EmpresaFormErrors = {};

  // Validación de nombre
  errores.nombre = validarNombre(formData.nombre);

  // Validación de identificación
  errores.identificacion = validarIdentificacion(formData.identificacion);

  // Validación de dirección
  errores.direccion = validarDireccion(formData.direccion);

  // Validación de teléfono
  errores.telefono = validarTelefono(formData.telefono);

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

function validarIdentificacion(identificacion: string): string | undefined {
  const trimmed = identificacion.trim();

  if (trimmed.length === 0) {
    return 'La identificación es obligatoria';
  }

  if (trimmed.length < 2) {
    return 'La identificación debe tener al menos 2 caracteres';
  }

  if (trimmed.length > 50) {
    return 'La identificación no puede exceder 50 caracteres';
  }

  return undefined;
}

function validarDireccion(direccion: string): string | undefined {
  const trimmed = direccion.trim();

  if (trimmed.length === 0) {
    return 'La dirección es obligatoria';
  }

  if (trimmed.length < 5 || trimmed.length > 200) {
    return 'La dirección debe tener entre 5 y 200 caracteres';
  }

  return undefined;
}

function validarTelefono(telefono: string): string | undefined {
  const trimmed = telefono.trim();

  // 1. Obligatorio
  if (trimmed.length === 0) {
    return 'El teléfono es obligatorio';
  }

  // 2. Formato: solo dígitos, guiones y espacios
  const formatoValido = /^[\d\s-]+$/;
  if (!formatoValido.test(trimmed)) {
    return 'El teléfono solo puede contener números, guiones y espacios';
  }

  // 3. Cantidad de dígitos: entre 7 y 15
  const digitos = trimmed.replace(/\D/g, '');
  if (digitos.length < 7 || digitos.length > 15) {
    return 'El teléfono debe tener entre 7 y 15 dígitos';
  }

  return undefined;
}
