using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.Services;
using CompanyProjectManagement.Application.Validators;
using CompanyProjectManagement.Domain.Entities;
using CompanyProjectManagement.Domain.Exceptions;
using CompanyProjectManagement.Domain.Repositories;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using NSubstitute;

namespace CompanyProjectManagement.Tests.PropertyTests;

// Feature: authentication-login-jwt, Property 5: Credenciales inválidas producen 401
//
// Para cualquier solicitud de login cuyo `username` no exista en el Almacen_Usuarios, o cuya
// contraseña no coincida con el hash almacenado del usuario existente, AuthService.LoginAsync
// lanza InvalidCredentialsException (que mapea a HTTP 401) y no emite token.
//
// **Validates: Requirements 1.3, 1.4**
/// <summary>
/// Property-based tests for <see cref="AuthService"/> covering the invalid-credentials paths.
/// Uses an in-memory/mock <see cref="IUsuarioRepository"/> plus mocked <see cref="IPasswordHasher"/>
/// and <see cref="ITokenService"/>, and the real <see cref="LoginRequestValidator"/> so the
/// generated inputs exercise the credentials path (not the input-validation path).
/// </summary>
public class AuthServiceInvalidCredentialsPropertyTests
{
    // Printable visible ASCII chars used to build valid, non-empty field values.
    private static readonly Gen<char> PrintableCharGen =
        Gen.Choose(33, 126).Select(i => (char)i);

    /// <summary>
    /// Generates non-empty, non-whitespace values (length 1-256) so the
    /// LoginRequestValidator passes and the credentials path is exercised.
    /// </summary>
    private static Gen<string> ValidField() =>
        Gen.Choose(1, 256)
            .SelectMany(len => Gen.ArrayOf(PrintableCharGen, len))
            .Select(chars => new string(chars));

    // Feature: authentication-login-jwt, Property 5: Credenciales inválidas producen 401
    //
    // **Validates: Requirements 1.3**
    /// <summary>
    /// For any valid-format login request whose username does not exist in the repository,
    /// LoginAsync throws InvalidCredentialsException and never invokes GenerateToken.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property NonexistentUsername_ThrowsInvalidCredentials_AndEmitsNoToken()
    {
        return Prop.ForAll(
            ValidField().ToArbitrary(),
            ValidField().ToArbitrary(),
            (username, password) =>
            {
                var usuarioRepository = Substitute.For<IUsuarioRepository>();
                var passwordHasher = Substitute.For<IPasswordHasher>();
                var tokenService = Substitute.For<ITokenService>();

                // Username does not exist in the store (Req 1.3).
                usuarioRepository.ObtenerPorUsernameAsync(Arg.Any<string>())
                    .Returns((Usuario?)null);

                var service = new AuthService(
                    usuarioRepository, passwordHasher, tokenService, new LoginRequestValidator());

                var act = async () => await service.LoginAsync(new LoginRequest(username, password));

                act.Should().ThrowExactlyAsync<InvalidCredentialsException>(
                    "a nonexistent username must be rejected as invalid credentials")
                    .GetAwaiter().GetResult();

                // No token must be emitted for invalid credentials.
                tokenService.DidNotReceiveWithAnyArgs().GenerateToken(default!, default!);
            });
    }

    // Feature: authentication-login-jwt, Property 5: Credenciales inválidas producen 401
    //
    // **Validates: Requirements 1.4**
    /// <summary>
    /// For any valid-format login request where the user exists but password verification
    /// returns false, LoginAsync throws InvalidCredentialsException and never invokes
    /// GenerateToken.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property WrongPassword_ThrowsInvalidCredentials_AndEmitsNoToken()
    {
        return Prop.ForAll(
            ValidField().ToArbitrary(),
            ValidField().ToArbitrary(),
            (username, password) =>
            {
                var usuarioRepository = Substitute.For<IUsuarioRepository>();
                var passwordHasher = Substitute.For<IPasswordHasher>();
                var tokenService = Substitute.For<ITokenService>();

                // The user exists in the store.
                var usuario = new Usuario
                {
                    Id = 1,
                    Username = username,
                    PasswordHash = "stored-hash",
                    PasswordSalt = "stored-salt"
                };
                usuarioRepository.ObtenerPorUsernameAsync(Arg.Any<string>())
                    .Returns(usuario);

                // Password verification fails (Req 1.4).
                passwordHasher.Verify(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>())
                    .Returns(false);

                var service = new AuthService(
                    usuarioRepository, passwordHasher, tokenService, new LoginRequestValidator());

                var act = async () => await service.LoginAsync(new LoginRequest(username, password));

                act.Should().ThrowExactlyAsync<InvalidCredentialsException>(
                    "an incorrect password must be rejected as invalid credentials")
                    .GetAwaiter().GetResult();

                // No token must be emitted for invalid credentials.
                tokenService.DidNotReceiveWithAnyArgs().GenerateToken(default!, default!);
            });
    }
}
