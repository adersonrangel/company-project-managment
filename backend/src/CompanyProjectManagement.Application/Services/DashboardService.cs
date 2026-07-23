using CompanyProjectManagement.Application.DTOs.Responses;
using CompanyProjectManagement.Domain.Repositories;

namespace CompanyProjectManagement.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IDashboardRepository _repository;

    public DashboardService(IDashboardRepository repository)
    {
        _repository = repository;
    }

    public async Task<DashboardEstadisticasResponse> ObtenerEstadisticasAsync()
    {
        var totalEmpresas = await _repository.ContarEmpresasAsync();
        var empresasHabilitadas = await _repository.ContarEmpresasHabilitadasAsync();
        var totalProyectos = await _repository.ContarProyectosAsync();
        var proyectosHabilitados = await _repository.ContarProyectosHabilitadosAsync();
        var proyectosPorEmpresa = await _repository.ObtenerProyectosPorEmpresaAsync();

        return new DashboardEstadisticasResponse(
            TotalEmpresas: totalEmpresas,
            EmpresasHabilitadas: empresasHabilitadas,
            EmpresasDeshabilitadas: totalEmpresas - empresasHabilitadas,
            TotalProyectos: totalProyectos,
            ProyectosHabilitados: proyectosHabilitados,
            ProyectosDeshabilitados: totalProyectos - proyectosHabilitados,
            ProyectosPorEmpresa: proyectosPorEmpresa
                .Select(x => new ProyectosPorEmpresaItem(x.NombreEmpresa, x.CantidadProyectos))
                .ToList()
        );
    }
}
