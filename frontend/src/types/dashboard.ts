export interface DashboardEstadisticas {
  totalEmpresas: number;
  empresasHabilitadas: number;
  empresasDeshabilitadas: number;
  totalProyectos: number;
  proyectosHabilitados: number;
  proyectosDeshabilitados: number;
  proyectosPorEmpresa: ProyectosPorEmpresa[];
}

export interface ProyectosPorEmpresa {
  nombreEmpresa: string;
  cantidadProyectos: number;
}
