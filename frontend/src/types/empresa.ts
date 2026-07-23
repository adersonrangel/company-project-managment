export interface Empresa {
  id: number;
  nombre: string;
  identificacion: string;
  direccion: string;
  telefono: string;
  estadoHabilitacion: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CrearEmpresaRequest {
  nombre: string;
  identificacion: string;
  telefono: string;
  direccion: string;
  estadoHabilitacion?: boolean;
}

export interface ActualizarEmpresaRequest {
  nombre: string;
  identificacion: string;
  telefono: string;
  direccion: string;
  estadoHabilitacion: boolean;
}
