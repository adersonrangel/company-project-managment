using CompanyProjectManagement.Domain.Entities;
using CompanyProjectManagement.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CompanyProjectManagement.Infrastructure.Data.Repositories;

public class ProyectoRepository : IProyectoRepository
{
    private readonly ApplicationDbContext _context;

    public ProyectoRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Proyecto> CrearAsync(Proyecto proyecto)
    {
        _context.Proyectos.Add(proyecto);
        await _context.SaveChangesAsync();
        return proyecto;
    }

    public async Task<IEnumerable<Proyecto>> ListarPorEmpresaAsync(int empresaId)
    {
        return await _context.Proyectos
            .AsNoTracking()
            .Where(p => p.EmpresaId == empresaId)
            .ToListAsync();
    }

    public async Task<Proyecto?> ObtenerPorIdAsync(int empresaId, int proyectoId)
    {
        return await _context.Proyectos
            .FirstOrDefaultAsync(p => p.EmpresaId == empresaId && p.Id == proyectoId);
    }

    public async Task<bool> ExisteNombreEnEmpresaAsync(string nombre, int empresaId, int? excluirId = null)
    {
        var query = _context.Proyectos
            .Where(p => p.EmpresaId == empresaId && p.Nombre == nombre);

        if (excluirId.HasValue)
        {
            query = query.Where(p => p.Id != excluirId.Value);
        }

        return await query.AnyAsync();
    }

    public async Task<Proyecto> ActualizarAsync(Proyecto proyecto)
    {
        _context.Proyectos.Update(proyecto);
        await _context.SaveChangesAsync();
        return proyecto;
    }

    public async Task EliminarAsync(Proyecto proyecto)
    {
        _context.Proyectos.Remove(proyecto);
        await _context.SaveChangesAsync();
    }
}
