using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.DTOs.Responses;
using CompanyProjectManagement.Tests.Infrastructure;
using FluentAssertions;
using Microsoft.IdentityModel.Tokens;

namespace CompanyProjectManagement.Tests.IntegrationTests;

/// <summary>
/// Pruebas de integración del pipeline de autenticación con <see cref="CustomWebApplicationFactory"/>.
/// Reutilizan el <c>public partial class Program { }</c>, la configuración JWT de prueba y un almacén
/// de usuarios sembrado para ejercer el flujo real de login y la protección de endpoints.
///
/// **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
/// </summary>
public class AuthenticationEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AuthenticationEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    #region Helpers

    /// <summary>
    /// Construye un JWT de prueba firmado con la clave y parámetros indicados. Permite
    /// producir tokens válidos, con firma inválida o expirados según los argumentos.
    /// </summary>
    private static string CrearToken(
        string secretKey,
        DateTime? expires = null,
        string issuer = CustomWebApplicationFactory.TestIssuer,
        string audience = CustomWebApplicationFactory.TestAudience)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var now = DateTime.UtcNow;
        var expiresAt = expires ?? now.AddMinutes(60);
        // notBefore siempre anterior a la expiración (incluso para tokens ya vencidos).
        var notBefore = expiresAt.AddMinutes(-60);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, "1"),
            new Claim(JwtRegisteredClaimNames.UniqueName, CustomWebApplicationFactory.SeededUsername)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: notBefore,
            expires: expiresAt,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private HttpRequestMessage GetProtegido(string path) => new(HttpMethod.Get, path);

    #endregion

    #region POST api/auth/login

    // Req 1.1: el endpoint responde en la ruta api/auth/login.
    [Fact]
    public async Task Login_RutaExiste_NoRetorna404()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(CustomWebApplicationFactory.SeededUsername, CustomWebApplicationFactory.SeededPassword));

        response.StatusCode.Should().NotBe(HttpStatusCode.NotFound,
            "el endpoint de login debe existir en la ruta api/auth/login");
    }

    // Req 1.2: credenciales válidas → 200 + token con vigencia de 3600 s.
    [Fact]
    public async Task Login_ConCredencialesValidas_Retorna200YToken()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(CustomWebApplicationFactory.SeededUsername, CustomWebApplicationFactory.SeededPassword));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var login = await response.Content.ReadFromJsonAsync<LoginResponse>();
        login.Should().NotBeNull();
        login!.Token.Should().NotBeNullOrWhiteSpace();
        login.ExpiresIn.Should().Be(3600);
    }

    // Req 1.3: usuario inexistente → 401.
    [Fact]
    public async Task Login_ConUsuarioInexistente_Retorna401()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest("usuario-que-no-existe", CustomWebApplicationFactory.SeededPassword));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // Req 1.4: contraseña incorrecta → 401.
    [Fact]
    public async Task Login_ConPasswordIncorrecta_Retorna401()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(CustomWebApplicationFactory.SeededUsername, "password-incorrecta"));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // Req 3.6: api/auth/login es accesible sin token.
    [Fact]
    public async Task Login_SinToken_EsAccesible()
    {
        // El cliente base no adjunta cabecera Authorization.
        _client.DefaultRequestHeaders.Authorization.Should().BeNull();

        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(CustomWebApplicationFactory.SeededUsername, CustomWebApplicationFactory.SeededPassword));

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            "el endpoint de login está marcado como [AllowAnonymous]");
    }

    #endregion

    #region Endpoint protegido y validación de token

    // Req 3.1: Bearer válido → 200.
    [Fact]
    public async Task EndpointProtegido_ConBearerValido_Retorna200()
    {
        var token = await _factory.ObtenerTokenValidoAsync();
        var request = GetProtegido("/api/empresas");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // Req 3.2: sin cabecera Authorization → 401.
    [Fact]
    public async Task EndpointProtegido_SinCabecera_Retorna401()
    {
        var response = await _client.GetAsync("/api/empresas");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // Req 3.3: cabecera malformada (sin esquema Bearer) → 401.
    [Fact]
    public async Task EndpointProtegido_ConCabeceraMalformada_Retorna401()
    {
        var request = GetProtegido("/api/empresas");
        request.Headers.TryAddWithoutValidation("Authorization", "TokenSinEsquemaBearer");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // Req 3.3: token vacío tras el esquema Bearer → 401.
    [Fact]
    public async Task EndpointProtegido_ConTokenVacio_Retorna401()
    {
        var request = GetProtegido("/api/empresas");
        request.Headers.TryAddWithoutValidation("Authorization", "Bearer ");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // Req 3.4: firma inválida (clave distinta) → 401.
    [Fact]
    public async Task EndpointProtegido_ConFirmaInvalida_Retorna401()
    {
        var tokenFirmaInvalida = CrearToken("clave-de-firma-totalmente-distinta-de-32-bytes-000!!");
        var request = GetProtegido("/api/empresas");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenFirmaInvalida);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // Req 3.5: token expirado (ClockSkew = 0) → 401.
    [Fact]
    public async Task EndpointProtegido_ConTokenExpirado_Retorna401()
    {
        var tokenExpirado = CrearToken(
            CustomWebApplicationFactory.TestSecretKey,
            expires: DateTime.UtcNow.AddMinutes(-5));
        var request = GetProtegido("/api/empresas");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenExpirado);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
            "con ClockSkew=0 un token vencido debe rechazarse de inmediato");
    }

    #endregion

    #region Protección de los controladores de negocio (Req 3.7)

    // Req 3.7: Dashboard, Empresa y Proyecto requieren token.
    [Theory]
    [InlineData("/api/dashboard/estadisticas")]
    [InlineData("/api/empresas")]
    [InlineData("/api/empresas/1/proyectos")]
    public async Task ControladoresDeNegocio_SinToken_Retornan401(string path)
    {
        var response = await _client.GetAsync(path);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
            $"el endpoint {path} debe requerir un JWT válido");
    }

    // Req 3.1 / 3.7: con Bearer válido los controladores de negocio son accesibles.
    [Theory]
    [InlineData("/api/dashboard/estadisticas")]
    [InlineData("/api/empresas")]
    public async Task ControladoresDeNegocio_ConBearerValido_NoRetornan401(string path)
    {
        var token = await _factory.ObtenerTokenValidoAsync();
        var request = GetProtegido(path);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized,
            $"un token válido debe permitir el acceso a {path}");
    }

    #endregion
}
