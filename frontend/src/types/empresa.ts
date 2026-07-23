export interface Empresa {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CrearEmpresaRequest {
  nombre: string;
  direccion: string;
  telefono: string;
}

export interface ActualizarEmpresaRequest {
  nombre: string;
  direccion: string;
  telefono: string;
}
