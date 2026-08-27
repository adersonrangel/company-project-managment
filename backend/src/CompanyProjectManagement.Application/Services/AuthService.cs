using System.Globalization;
using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.DTOs.Responses;
using CompanyProjectManagement.Domain.Exceptions;
using CompanyProjectManagement.Domain.Repositories;
using FluentValidation;

namespace CompanyProjectManagement.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IValidator<LoginRequest> _loginValidator;

    public AuthService(
        IUsuarioRepository usuarioRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        IValidator<LoginRequest> loginValidator)
    {
        _usuarioRepository = usuarioRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _loginValidator = loginValidator;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        // Req 1.5: validar la entrada; en fallo -> ValidationException (400) con el campo infractor.
        var validationResult = await _loginValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        // Req 1.3: usuario inexistente -> InvalidCredentialsException (401, mensaje genérico).
        var usuario = await _usuarioRepository.ObtenerPorUsernameAsync(request.Username);
        if (usuario is null)
        {
            throw new InvalidCredentialsException();
        }

        // Req 1.4: contraseña incorrecta -> InvalidCredentialsException (401, mensaje genérico).
        if (!_passwordHasher.Verify(request.Password, usuario.PasswordHash, usuario.PasswordSalt))
        {
            throw new InvalidCredentialsException();
        }

        // Req 1.2: credenciales válidas -> emitir JWT con vigencia de 3600 segundos.
        var tokenResult = _tokenService.GenerateToken(
            usuario.Id.ToString(CultureInfo.InvariantCulture),
            usuario.Username);

        return new LoginResponse(tokenResult.Token, 3600);
    }
}
