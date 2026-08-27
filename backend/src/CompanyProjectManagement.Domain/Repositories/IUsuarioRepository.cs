using CompanyProjectManagement.Domain.Entities;

namespace CompanyProjectManagement.Domain.Repositories;

public interface IUsuarioRepository
{
    Task<Usuario?> ObtenerPorUsernameAsync(string username);
    Task<bool> ExisteUsernameAsync(string username);
    Task<Usuario> CrearAsync(Usuario usuario);
}
