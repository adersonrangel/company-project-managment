using CompanyProjectManagement.Domain.Entities;
using CompanyProjectManagement.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CompanyProjectManagement.Infrastructure.Data.Repositories;

public class EmpresaRepository : IEmpresaRepository
{
    private readonly ApplicationDbContext _context;

    public EmpresaRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Empresa> CrearAsync(Empresa empresa)
    {
        _context.Empresas.Add(empresa);
        await _context.SaveChangesAsync();
        return empresa;
    }

    public async Task<IEnumerable<Empresa>> ListarAsync()
    {
        return await _context.Empresas
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Empresa?> ObtenerPorIdAsync(int id)
    {
        return await _context.Empresas
            .Include(e => e.Proyectos)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<Empresa?> ObtenerPorIdentificacionAsync(string identificacion)
    {
        return await _context.Empresas
            .FirstOrDefaultAsync(e => e.Identificacion == identificacion);
    }

    public async Task<bool> ExisteIdentificacionAsync(string identificacion, int? excluirId = null)
    {
        var query = _context.Empresas.Where(e => e.Identificacion == identificacion);

        if (excluirId.HasValue)
        {
            query = query.Where(e => e.Id != excluirId.Value);
        }

        return await query.AnyAsync();
    }

    public async Task<Empresa> ActualizarAsync(Empresa empresa)
    {
        _context.Empresas.Update(empresa);
        await _context.SaveChangesAsync();
        return empresa;
    }

    public async Task EliminarAsync(Empresa empresa)
    {
        _context.Empresas.Remove(empresa);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> TieneProyectosAsync(int empresaId)
    {
        return await _context.Proyectos
            .AnyAsync(p => p.EmpresaId == empresaId);
    }
}
