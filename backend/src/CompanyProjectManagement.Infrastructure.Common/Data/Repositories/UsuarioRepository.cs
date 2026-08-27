using CompanyProjectManagement.Domain.Entities;
using CompanyProjectManagement.Domain.Exceptions;
using CompanyProjectManagement.Domain.Repositories;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;

namespace CompanyProjectManagement.Infrastructure.Data.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private const int UsernameMinLength = 3;
    private const int UsernameMaxLength = 64;

    private readonly ApplicationDbContext _context;

    public UsuarioRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Usuario?> ObtenerPorUsernameAsync(string username)
    {
        return await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<bool> ExisteUsernameAsync(string username)
    {
        return await _context.Usuarios
            .AnyAsync(u => u.Username == username);
    }

    public async Task<Usuario> CrearAsync(Usuario usuario)
    {
        // Req 4.7: rechazar username vacío o fuera del rango [3, 64] con error de validación.
        if (string.IsNullOrWhiteSpace(usuario.Username)
            || usuario.Username.Length < UsernameMinLength
            || usuario.Username.Length > UsernameMaxLength)
        {
            throw new ValidationException(
            [
                new ValidationFailure(
                    nameof(Usuario.Username),
                    $"El nombre de usuario debe tener entre {UsernameMinLength} y {UsernameMaxLength} caracteres.")
            ]);
        }

        // Req 4.6: username duplicado -> conflicto, preservar el existente sin modificarlo.
        if (await ExisteUsernameAsync(usuario.Username))
        {
            throw new DuplicateIdentificationException("Usuario", "Username", usuario.Username);
        }

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();
        return usuario;
    }
}
