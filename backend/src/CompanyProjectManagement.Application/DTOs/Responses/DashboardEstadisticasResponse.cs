namespace CompanyProjectManagement.Application.DTOs.Responses;

public record DashboardEstadisticasResponse(
    int TotalEmpresas,
    int EmpresasHabilitadas,
    int EmpresasDeshabilitadas,
    int TotalProyectos,
    int ProyectosHabilitados,
    int ProyectosDeshabilitados,
    List<ProyectosPorEmpresaItem> ProyectosPorEmpresa
);

public record ProyectosPorEmpresaItem(
    string NombreEmpresa,
    int CantidadProyectos
);
