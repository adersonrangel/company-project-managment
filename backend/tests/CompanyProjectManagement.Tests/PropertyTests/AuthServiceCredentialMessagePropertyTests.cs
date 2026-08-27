using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.Options;
using CompanyProjectManagement.Application.Services;
using CompanyProjectManagement.Application.Validators;
using CompanyProjectManagement.Domain.Entities;
using CompanyProjectManagement.Domain.Exceptions;
using CompanyProjectManagement.Domain.Repositories;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.Options;

namespace CompanyProjectManagement.Tests.PropertyTests;

// Feature: authentication-login-jwt, Property 6: Mensaje de credenciales inválidas indistinguible
//
// Para cualquier par de fallos de autenticación (uno por usuario inexistente y otro por
// contraseña incorrecta), el mensaje devuelto es idéntico y no revela cuál de los dos
// factores falló.
//
// **Validates: Requirements 1.6**
/// <summary>
/// Property tests verifying that <see cref="AuthService"/> produces an indistinguishable
/// error message whether authentication fails because the username does not exist or because
/// the password is incorrect for an existing user. This prevents user enumeration.
/// </summary>
public class AuthServiceCredentialMessagePropertyTests
{
    private const string TestSecretKey = "test-secret-key-with-at-least-32-bytes-of-length!!";
    private const string TestIssuer = "CompanyProjectManagement";
    private const string TestAudience = "CompanyProjectManagementClient";

    // Printable visible ASCII chars used to build non-empty field values.
    private static readonly Gen<char> PrintableCharGen =
        Gen.Choose(33, 126).Select(i => (char)i);

    /// <summary>
    /// Generates non-empty, non-whitespace strings of length 1-256 (printable ASCII), so the
    /// generated username/password always pass <see cref="LoginRequestValidator"/> and the
    /// credential-verification path is exercised (rather than short-circuiting on validation).
    /// </summary>
    private static Gen<string> ValidField(int minLen = 1, int maxLen = 256) =>
        Gen.Choose(minLen, maxLen)
            .SelectMany(len => Gen.ArrayOf(PrintableCharGen, len))
            .Select(chars => new string(chars));

    private static AuthService CreateService(IUsuarioRepository repository)
    {
        var tokenOptions = Options.Create(new JwtOptions
        {
            SecretKey = TestSecretKey,
            Issuer = TestIssuer,
            Audience = TestAudience,
            ExpirationMinutes = 60
        });

        return new AuthService(
            repository,
            new PasswordHasher(),
            new JwtTokenService(tokenOptions),
            new LoginRequestValidator());
    }

    /// <summary>
    /// Minimal in-memory <see cref="IUsuarioRepository"/> seeded with a single existing user.
    /// Only <see cref="ObtenerPorUsernameAsync"/> is exercised by the login path.
    /// </summary>
    private sealed class InMemoryUsuarioRepository : IUsuarioRepository
    {
        private readonly Dictionary<string, Usuario> _usuarios;

        public InMemoryUsuarioRepository(IEnumerable<Usuario> usuarios)
        {
            _usuarios = usuarios.ToDictionary(u => u.Username, StringComparer.Ordinal);
        }

        public Task<Usuario?> ObtenerPorUsernameAsync(string username) =>
            Task.FromResult(_usuarios.TryGetValue(username, out var usuario) ? usuario : null);

        public Task<bool> ExisteUsernameAsync(string username) =>
            Task.FromResult(_usuarios.ContainsKey(username));

        public Task<Usuario> CrearAsync(Usuario usuario)
        {
            _usuarios[usuario.Username] = usuario;
            return Task.FromResult(usuario);
        }
    }

    // Feature: authentication-login-jwt, Property 6: Mensaje de credenciales inválidas indistinguible
    //
    // Para cualquier par de fallos — usuario inexistente vs. contraseña incorrecta de un usuario
    // existente — el Message de la InvalidCredentialsException es idéntico.
    //
    // **Validates: Requirements 1.6**
    /// <summary>
    /// For any existing user with a correct password, a login failure caused by a nonexistent
    /// username and a login failure caused by a wrong password on the existing user both throw
    /// <see cref="InvalidCredentialsException"/> with an identical message.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property NonexistentUserAndWrongPassword_ProduceIdenticalMessage()
    {
        // Generate: an existing username, its correct password, a distinct wrong password,
        // and a nonexistent username that differs from the existing one. All fields satisfy
        // LoginRequestValidator (non-empty, length 1-256).
        var inputGen =
            from existingUsername in ValidField()
            from correctPassword in ValidField()
            from wrongPassword in ValidField().Where(p => p != correctPassword)
            from missingUsername in ValidField().Where(u => u != existingUsername)
            select (existingUsername, correctPassword, wrongPassword, missingUsername);

        return Prop.ForAll(
            inputGen.ToArbitrary(),
            input =>
            {
                var (existingUsername, correctPassword, wrongPassword, missingUsername) = input;

                var hasher = new PasswordHasher();
                var (hash, salt) = hasher.Hash(correctPassword);

                var repository = new InMemoryUsuarioRepository(new[]
                {
                    new Usuario
                    {
                        Id = 1,
                        Username = existingUsername,
                        PasswordHash = hash,
                        PasswordSalt = salt
                    }
                });

                var service = CreateService(repository);

                // Failure 1: nonexistent username (Req 1.3).
                var nonexistentUserFailure = service
                    .Invoking(s => s.LoginAsync(new LoginRequest(missingUsername, correctPassword)))
                    .Should().ThrowAsync<InvalidCredentialsException>()
                    .Result.Which;

                // Failure 2: wrong password for the existing user (Req 1.4).
                var wrongPasswordFailure = service
                    .Invoking(s => s.LoginAsync(new LoginRequest(existingUsername, wrongPassword)))
                    .Should().ThrowAsync<InvalidCredentialsException>()
                    .Result.Which;

                // Req 1.6: the messages must be identical and reveal nothing about the factor.
                nonexistentUserFailure.Message.Should().Be(
                    wrongPasswordFailure.Message,
                    "the failure message must not reveal whether the username or the password failed");
            });
    }
}
