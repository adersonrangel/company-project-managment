export interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string | null;
  empresaId: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CrearProyectoRequest {
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin?: string | null;
}

export interface ActualizarProyectoRequest {
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin?: string | null;
}
