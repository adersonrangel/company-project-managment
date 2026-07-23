namespace CompanyProjectManagement.Domain.Repositories;

public interface IDashboardRepository
{
    Task<int> ContarEmpresasAsync();
    Task<int> ContarEmpresasHabilitadasAsync();
    Task<int> ContarProyectosAsync();
    Task<int> ContarProyectosHabilitadosAsync();
    Task<IEnumerable<EmpresaProyectoCount>> ObtenerProyectosPorEmpresaAsync();
}

public record EmpresaProyectoCount(string NombreEmpresa, int CantidadProyectos);
