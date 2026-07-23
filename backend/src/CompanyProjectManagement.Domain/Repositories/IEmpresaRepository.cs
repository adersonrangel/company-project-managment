using CompanyProjectManagement.Domain.Entities;

namespace CompanyProjectManagement.Domain.Repositories;

public interface IEmpresaRepository
{
    Task<Empresa> CrearAsync(Empresa empresa);
    Task<IEnumerable<Empresa>> ListarAsync();
    Task<Empresa?> ObtenerPorIdAsync(int id);
    Task<Empresa?> ObtenerPorIdentificacionAsync(string identificacion);
    Task<bool> ExisteIdentificacionAsync(string identificacion, int? excluirId = null);
    Task<Empresa> ActualizarAsync(Empresa empresa);
    Task EliminarAsync(Empresa empresa);
    Task<bool> TieneProyectosAsync(int empresaId);
}
