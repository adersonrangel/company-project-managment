import type { ProyectosPorEmpresa } from '@/types/dashboard';

/**
 * Calcula el porcentaje de un valor respecto a un total.
 * Retorna 0 si el total es 0.
 */
export function calcularPorcentaje(
  valor: number,
  total: number,
  decimales: number
): number {
  if (total === 0) return 0;
  const porcentaje = (valor / total) * 100;
  const factor = Math.pow(10, decimales);
  return Math.round(porcentaje * factor) / factor;
}

/**
 * Trunca un nombre si excede maxLength caracteres, añadiendo "..." al final.
 * Si el nombre no excede maxLength, lo retorna sin cambios.
 */
export function truncarNombre(nombre: string, maxLength: number): string {
  if (nombre.length > maxLength) {
    return nombre.slice(0, maxLength) + '...';
  }
  return nombre;
}

/**
 * Ordena los datos por cantidadProyectos de forma descendente y
 * retorna los primeros maxItems elementos.
 */
export function prepararDatosBarras(
  datos: ProyectosPorEmpresa[],
  maxItems: number
): ProyectosPorEmpresa[] {
  return [...datos]
    .sort((a, b) => b.cantidadProyectos - a.cantidadProyectos)
    .slice(0, maxItems);
}
