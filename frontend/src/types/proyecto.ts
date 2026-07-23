/** Respuesta del listado de proyectos — alineado con ProyectoListResponse del backend */
export interface ProyectoListResponse {
  id: number;
  nombre: string;
  fechaHabilitacion: string; // ISO 8601 YYYY-MM-DD
  estadoHabilitacion: boolean;
}

/** Respuesta completa de un proyecto — alineado con ProyectoResponse del backend */
export interface ProyectoResponse {
  id: number;
  nombre: string;
  fechaHabilitacion: string; // ISO 8601 YYYY-MM-DD
  estadoHabilitacion: boolean;
  empresaId: number;
}

/** Request para crear proyecto — alineado con CrearProyectoRequest del backend */
export interface CrearProyectoRequest {
  nombre: string;
  fechaHabilitacion: string; // ISO 8601 YYYY-MM-DD
  estadoHabilitacion?: boolean;
}

/** Request para actualizar proyecto — alineado con ActualizarProyectoRequest del backend */
export interface ActualizarProyectoRequest {
  nombre?: string;
  fechaHabilitacion?: string; // ISO 8601 YYYY-MM-DD
  estadoHabilitacion?: boolean;
}
