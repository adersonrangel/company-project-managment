using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CompanyProjectManagement.Application.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CompanyProjectManagement.Application.Services;

/// <summary>
/// Genera y firma tokens JWT usando HMAC-SHA256 con la clave secreta obtenida de <see cref="JwtOptions"/>.
/// La expiración es el instante de emisión más <see cref="JwtOptions.ExpirationMinutes"/> minutos.
/// El token incluye claims de identificador (sub) y nombre de usuario (unique_name) no vacíos.
/// </summary>
public class JwtTokenService : ITokenService
{
    private readonly JwtOptions _options;

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    // Req 2.1-2.3, 2.7, 2.8
    public TokenResult GenerateToken(string userId, string username)
    {
        // Req 2.7: datos de usuario vacíos impiden la emisión del token.
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new InvalidOperationException("El identificador de usuario es obligatorio para emitir el token.");
        }

        if (string.IsNullOrWhiteSpace(username))
        {
            throw new InvalidOperationException("El nombre de usuario es obligatorio para emitir el token.");
        }

        var expirationMinutes = _options.ExpirationMinutes;
        var expiresInSeconds = expirationMinutes * 60;

        var issuedAt = DateTime.UtcNow;
        var expires = issuedAt.AddMinutes(expirationMinutes);

        // Req 2.3: claims de identificador y nombre de usuario no vacíos.
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(JwtRegisteredClaimNames.UniqueName, username),
            new Claim(ClaimTypes.Name, username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        try
        {
            // Req 2.1: firma HMAC-SHA256 con la clave secreta configurada.
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SecretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var jwt = new JwtSecurityToken(
                issuer: _options.Issuer,
                audience: _options.Audience,
                claims: claims,
                notBefore: issuedAt,
                expires: expires,
                signingCredentials: credentials);

            var token = new JwtSecurityTokenHandler().WriteToken(jwt);

            return new TokenResult(token, expiresInSeconds);
        }
        catch (Exception ex)
        {
            // Req 2.8: si la firma falla, no se emite token.
            throw new InvalidOperationException("No se pudo firmar el token JWT.", ex);
        }
    }
}
