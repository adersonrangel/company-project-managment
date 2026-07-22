using CompanyProjectManagement.Domain.Entities;

namespace CompanyProjectManagement.Domain.Repositories;

public interface IProyectoRepository
{
    Task<Proyecto> CrearAsync(Proyecto proyecto);
    Task<IEnumerable<Proyecto>> ListarPorEmpresaAsync(int empresaId);
    Task<Proyecto?> ObtenerPorIdAsync(int empresaId, int proyectoId);
    Task<bool> ExisteNombreEnEmpresaAsync(string nombre, int empresaId, int? excluirId = null);
    Task<Proyecto> ActualizarAsync(Proyecto proyecto);
    Task EliminarAsync(Proyecto proyecto);
}
