using CompanyProjectManagement.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CompanyProjectManagement.Infrastructure.Data.Repositories;

public class DashboardRepository : IDashboardRepository
{
    private readonly ApplicationDbContext _context;

    public DashboardRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<int> ContarEmpresasAsync()
        => _context.Empresas.CountAsync();

    public Task<int> ContarEmpresasHabilitadasAsync()
        => _context.Empresas.CountAsync(e => e.EstadoHabilitacion);

    public Task<int> ContarProyectosAsync()
        => _context.Proyectos.CountAsync();

    public Task<int> ContarProyectosHabilitadosAsync()
        => _context.Proyectos.CountAsync(p => p.EstadoHabilitacion);

    public async Task<IEnumerable<EmpresaProyectoCount>> ObtenerProyectosPorEmpresaAsync()
    {
        return await _context.Empresas
            .Where(e => e.Proyectos.Any())
            .OrderByDescending(e => e.Proyectos.Count)
            .Select(e => new EmpresaProyectoCount(
                e.Nombre,
                e.Proyectos.Count
            ))
            .ToListAsync();
    }
}
