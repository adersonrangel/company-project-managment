namespace CompanyProjectManagement.Application.Services;

public interface ITokenService
{
    // Req 2.1-2.3, 2.7, 2.8: devuelve un token firmado junto con sus segundos de vigencia.
    TokenResult GenerateToken(string userId, string username);
}

public record TokenResult(string Token, int ExpiresInSeconds);
