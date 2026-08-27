using CompanyProjectManagement.Domain.Entities;
using CompanyProjectManagement.Infrastructure.Data;
using CompanyProjectManagement.Infrastructure.Data.Repositories;
using FluentAssertions;
using FluentValidation;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;

namespace CompanyProjectManagement.Tests.PropertyTests;

// Feature: authentication-login-jwt, Property 10: Validación del rango de nombre de usuario en persistencia
//
// Para cualquier `username` vacío o de longitud fuera de [3, 64], la creación de `Usuario` se
// rechaza con un error de validación (ValidationException) y no se persiste.
//
// **Validates: Requirements 4.7**
/// <summary>
/// Property-based tests for <see cref="UsuarioRepository.CrearAsync"/> covering the
/// username-range validation of the persistence layer. Uses an in-memory
/// <see cref="ApplicationDbContext"/> so the real repository logic runs against a real EF store,
/// verifying both the thrown <see cref="ValidationException"/> and that nothing is persisted.
/// </summary>
public class UsuarioUsernameRangePersistencePropertyTests
{
    private const int UsernameMinLength = 3;
    private const int UsernameMaxLength = 64;

    // Printable visible ASCII chars used to build username values of a controlled length.
    private static readonly Gen<char> PrintableCharGen =
        Gen.Choose(33, 126).Select(i => (char)i);

    private static Gen<string> NonEmptyStringOfLength(int minLen, int maxLen) =>
        Gen.Choose(minLen, maxLen)
            .SelectMany(len => Gen.ArrayOf(PrintableCharGen, len))
            .Select(chars => new string(chars));

    /// <summary>
    /// Generates usernames that MUST be rejected by the persistence layer:
    /// - empty string,
    /// - whitespace-only strings,
    /// - non-empty strings shorter than the minimum length [1, 2],
    /// - strings longer than the maximum length [65, 120].
    /// </summary>
    private static Gen<string> InvalidUsername() =>
        Gen.OneOf(
            Gen.Constant(string.Empty),
            Gen.Constant("   "),
            Gen.Constant("\t\n"),
            NonEmptyStringOfLength(1, UsernameMinLength - 1),
            NonEmptyStringOfLength(UsernameMaxLength + 1, UsernameMaxLength + 56));

    private static ApplicationDbContext CreateInMemoryContext() =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"UsuarioUsernameRange_{Guid.NewGuid()}")
            .Options);

    // Feature: authentication-login-jwt, Property 10: Validación del rango de nombre de usuario en persistencia
    //
    // **Validates: Requirements 4.7**
    /// <summary>
    /// For any username that is empty or whose length falls outside [3, 64], CrearAsync throws
    /// ValidationException and leaves the store empty (nothing is persisted).
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CrearAsync_ConUsernameFueraDeRango_LanzaValidacionYNoPersiste()
    {
        return Prop.ForAll(
            InvalidUsername().ToArbitrary(),
            username =>
            {
                using var context = CreateInMemoryContext();
                var repository = new UsuarioRepository(context);

                var usuario = new Usuario
                {
                    Username = username,
                    PasswordHash = "stored-hash",
                    PasswordSalt = "stored-salt"
                };

                var act = async () => await repository.CrearAsync(usuario);

                act.Should().ThrowExactlyAsync<ValidationException>(
                    "an empty username or one whose length is outside [3, 64] must be rejected " +
                    "with a validation error")
                    .GetAwaiter().GetResult();

                // Nothing must have been persisted for the rejected username.
                context.Usuarios.AsNoTracking().Any().Should().BeFalse(
                    "a username rejected by validation must not be persisted");
            });
    }
}
