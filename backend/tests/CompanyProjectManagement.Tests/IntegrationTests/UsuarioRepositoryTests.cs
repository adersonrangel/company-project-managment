using CompanyProjectManagement.Domain.Entities;
using CompanyProjectManagement.Domain.Exceptions;
using CompanyProjectManagement.Infrastructure.Data;
using CompanyProjectManagement.Infrastructure.Data.Repositories;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace CompanyProjectManagement.Tests.IntegrationTests;

/// <summary>
/// Pruebas de integración del <see cref="UsuarioRepository"/> contra un
/// <see cref="ApplicationDbContext"/> en memoria (EF real), cubriendo el ciclo de
/// creación/recuperación, la ausencia de usuario y el conflicto por username duplicado.
///
/// **Validates: Requirements 4.4, 4.5, 4.6**
/// </summary>
public class UsuarioRepositoryTests
{
    private static ApplicationDbContext CreateInMemoryContext() =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"UsuarioRepository_{Guid.NewGuid()}")
            .Options);

    private static Usuario CrearUsuarioValido(string? username = null) => new()
    {
        Username = username ?? $"user-{Guid.NewGuid():N}"[..16],
        PasswordHash = "stored-hash",
        PasswordSalt = "stored-salt"
    };

    // **Validates: Requirements 4.4**
    /// <summary>
    /// Tras crear un Usuario, ObtenerPorUsernameAsync recupera el mismo Usuario persistido.
    /// </summary>
    [Fact]
    public async Task CrearAsync_LuegoObtenerPorUsername_RecuperaUsuarioExistente()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var repository = new UsuarioRepository(context);
        var usuario = CrearUsuarioValido("usuario-existente");

        // Act
        var creado = await repository.CrearAsync(usuario);
        var recuperado = await repository.ObtenerPorUsernameAsync("usuario-existente");

        // Assert
        creado.Id.Should().BeGreaterThan(0);

        recuperado.Should().NotBeNull();
        recuperado!.Id.Should().Be(creado.Id);
        recuperado.Username.Should().Be("usuario-existente");
        recuperado.PasswordHash.Should().Be("stored-hash");
        recuperado.PasswordSalt.Should().Be("stored-salt");
    }

    // **Validates: Requirements 4.4**
    /// <summary>
    /// ExisteUsernameAsync devuelve true para un Usuario previamente persistido.
    /// </summary>
    [Fact]
    public async Task ExisteUsernameAsync_ConUsuarioPersistido_RetornaTrue()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var repository = new UsuarioRepository(context);
        await repository.CrearAsync(CrearUsuarioValido("usuario-presente"));

        // Act
        var existe = await repository.ExisteUsernameAsync("usuario-presente");

        // Assert
        existe.Should().BeTrue();
    }

    // **Validates: Requirements 4.5**
    /// <summary>
    /// ObtenerPorUsernameAsync devuelve null para un username inexistente y no crea
    /// ningún Usuario en el almacén.
    /// </summary>
    [Fact]
    public async Task ObtenerPorUsernameAsync_ConUsernameInexistente_RetornaNullSinCrear()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var repository = new UsuarioRepository(context);

        // Act
        var recuperado = await repository.ObtenerPorUsernameAsync("no-existe");

        // Assert
        recuperado.Should().BeNull();
        context.Usuarios.AsNoTracking().Any().Should().BeFalse(
            "consultar un username inexistente no debe crear ningún usuario");
    }

    // **Validates: Requirements 4.6**
    /// <summary>
    /// Al intentar persistir un Usuario con un username ya existente, CrearAsync rechaza la
    /// operación con DuplicateIdentificationException (mapea a HTTP 409) y preserva el Usuario
    /// existente sin modificarlo ni duplicarlo.
    /// </summary>
    [Fact]
    public async Task CrearAsync_ConUsernameDuplicado_LanzaConflictoYPreservaExistente()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var repository = new UsuarioRepository(context);

        var existente = new Usuario
        {
            Username = "duplicado",
            PasswordHash = "hash-original",
            PasswordSalt = "salt-original"
        };
        var creado = await repository.CrearAsync(existente);

        var duplicado = new Usuario
        {
            Username = "duplicado",
            PasswordHash = "hash-nuevo",
            PasswordSalt = "salt-nuevo"
        };

        // Act
        var act = async () => await repository.CrearAsync(duplicado);

        // Assert
        await act.Should().ThrowExactlyAsync<DuplicateIdentificationException>(
            "un username ya existente debe informar el conflicto de duplicado");

        // El Usuario existente se preserva sin modificar y no se crea un duplicado.
        var usuarios = context.Usuarios.AsNoTracking()
            .Where(u => u.Username == "duplicado")
            .ToList();
        usuarios.Should().HaveCount(1, "no debe persistirse un usuario duplicado");

        var preservado = usuarios[0];
        preservado.Id.Should().Be(creado.Id);
        preservado.PasswordHash.Should().Be("hash-original");
        preservado.PasswordSalt.Should().Be("salt-original");
    }
}
