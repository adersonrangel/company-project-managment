using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CompanyProjectManagement.Application.Options;
using CompanyProjectManagement.Application.Services;
using CompanyProjectManagement.Infrastructure.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace CompanyProjectManagement.Tests.IntegrationTests;

/// <summary>
/// Pruebas de arranque/configuración (smoke) del backend.
///
/// Verifican el comportamiento fail-fast de la validación de <see cref="JwtOptions"/> en
/// <c>Program.cs</c> y que <see cref="JwtTokenService"/> toma sus valores desde el
/// <see cref="JwtOptions"/> inyectado (vía DI).
///
/// **Validates: Requirements 2.4, 2.5, 2.6**
/// </summary>
public class StartupConfigurationSmokeTests
{
    private const string ValidSecretKey = "test-secret-key-with-at-least-32-bytes-of-length!!";
    private const string ValidIssuer = "CompanyProjectManagement";
    private const string ValidAudience = "CompanyProjectManagementClient";

    /// <summary>
    /// Construye una <see cref="WebApplicationFactory{TEntryPoint}"/> que sobreescribe la sección
    /// <c>Jwt</c> con los valores indicados y usa una base de datos en memoria para no depender
    /// de una conexión real. Un valor vacío (<see cref="string.Empty"/>) representa un parámetro
    /// ausente respecto de la validación fail-fast (que rechaza valores nulos o en blanco).
    /// </summary>
    private static WebApplicationFactory<Program> CreateFactory(
        string secretKey,
        string issuer,
        string audience)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");

            // UseSetting alimenta la configuración del host que WebApplication.CreateBuilder
            // consume, por lo que estos valores prevalecen sobre appsettings.json al validar
            // JwtOptions en Program.cs (fail-fast).
            builder.UseSetting("Jwt:SecretKey", secretKey);
            builder.UseSetting("Jwt:Issuer", issuer);
            builder.UseSetting("Jwt:Audience", audience);
            builder.UseSetting("Jwt:ExpirationMinutes", "60");

            builder.ConfigureServices(services =>
            {
                // Reemplazar cualquier registro de EF/DbContext por una base en memoria para que
                // el chequeo de conectividad del arranque no dependa de una BD real.
                var descriptorsToRemove = services
                    .Where(d =>
                        d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>)
                        || d.ServiceType == typeof(DbContextOptions)
                        || d.ServiceType == typeof(ApplicationDbContext)
                        || (d.ServiceType.FullName?.Contains("EntityFrameworkCore") == true)
                        || (d.ServiceType.FullName?.Contains("SqlServer") == true)
                        || (d.ImplementationType?.FullName?.Contains("SqlServer") == true)
                        || (d.ImplementationType?.FullName?.Contains("EntityFrameworkCore") == true))
                    .ToList();

                foreach (var descriptor in descriptorsToRemove)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseInMemoryDatabase($"SmokeTestDb_{Guid.NewGuid()}");
                });
            });
        });
    }

    /// <summary>
    /// Fuerza la construcción del host (y con ella la validación fail-fast) capturando la
    /// excepción resultante junto con su cadena de mensajes internos.
    /// </summary>
    private static (Exception? Exception, string Messages) TryStartHost(WebApplicationFactory<Program> factory)
    {
        try
        {
            // Forzar el arranque del host (dispara la validación de JwtOptions en Program.cs).
            _ = factory.Services;
            return (null, string.Empty);
        }
        catch (Exception ex)
        {
            var messages = new StringBuilder();
            for (Exception? current = ex; current is not null; current = current.InnerException)
            {
                messages.AppendLine(current.Message);
            }

            return (ex, messages.ToString());
        }
    }

    // Req 2.5: al faltar la clave secreta, el arranque falla con un mensaje que menciona la clave.
    /// <summary>
    /// Construir el host sin <c>Jwt:SecretKey</c> impide el arranque con un mensaje que menciona
    /// la clave secreta.
    /// </summary>
    [Fact]
    public void Startup_WithoutSecretKey_FailsMentioningTheSecretKey()
    {
        using var factory = CreateFactory(secretKey: string.Empty, issuer: ValidIssuer, audience: ValidAudience);

        var (exception, messages) = TryStartHost(factory);

        exception.Should().NotBeNull("la ausencia de la clave secreta debe impedir el arranque");
        messages.Should().Contain("Jwt:SecretKey",
            "el mensaje de error debe nombrar el parámetro de la clave secreta ausente");
    }

    // Req 2.6: al faltar el emisor, el arranque falla nombrando el parámetro.
    /// <summary>
    /// Construir el host sin <c>Jwt:Issuer</c> impide el arranque con un mensaje que nombra el
    /// parámetro del emisor.
    /// </summary>
    [Fact]
    public void Startup_WithoutIssuer_FailsNamingTheIssuerParameter()
    {
        using var factory = CreateFactory(secretKey: ValidSecretKey, issuer: string.Empty, audience: ValidAudience);

        var (exception, messages) = TryStartHost(factory);

        exception.Should().NotBeNull("la ausencia del emisor debe impedir el arranque");
        messages.Should().Contain("Jwt:Issuer",
            "el mensaje de error debe nombrar el parámetro del emisor ausente");
    }

    // Req 2.6: al faltar la audiencia, el arranque falla nombrando el parámetro.
    /// <summary>
    /// Construir el host sin <c>Jwt:Audience</c> impide el arranque con un mensaje que nombra el
    /// parámetro de la audiencia.
    /// </summary>
    [Fact]
    public void Startup_WithoutAudience_FailsNamingTheAudienceParameter()
    {
        using var factory = CreateFactory(secretKey: ValidSecretKey, issuer: ValidIssuer, audience: string.Empty);

        var (exception, messages) = TryStartHost(factory);

        exception.Should().NotBeNull("la ausencia de la audiencia debe impedir el arranque");
        messages.Should().Contain("Jwt:Audience",
            "el mensaje de error debe nombrar el parámetro de la audiencia ausente");
    }

    // Req 2.4: JwtTokenService toma la clave, el emisor y la audiencia desde JwtOptions inyectado.
    /// <summary>
    /// Con una configuración <c>Jwt</c> válida el host arranca y el <see cref="ITokenService"/>
    /// resuelto por DI emite un token cuyos emisor/audiencia coinciden con la configuración y que
    /// se valida con la clave secreta configurada; esto demuestra que toma los valores desde el
    /// <see cref="JwtOptions"/> inyectado.
    /// </summary>
    [Fact]
    public void JwtTokenService_UsesInjectedJwtOptions()
    {
        using var factory = CreateFactory(
            secretKey: ValidSecretKey, issuer: ValidIssuer, audience: ValidAudience);

        using var scope = factory.Services.CreateScope();
        var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

        var result = tokenService.GenerateToken("user-1", "usuario");

        // El token debe validarse con la clave/emisor/audiencia provistos por configuración,
        // lo que prueba que JwtTokenService los tomó desde el JwtOptions inyectado.
        var handler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = ValidIssuer,
            ValidateAudience = true,
            ValidAudience = ValidAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(ValidSecretKey)),
            ClockSkew = TimeSpan.Zero
        };

        var validate = () => handler.ValidateToken(result.Token, validationParameters, out _);
        validate.Should().NotThrow(
            "el token debe validarse con la configuración inyectada (clave, emisor y audiencia)");

        var jwt = handler.ReadJwtToken(result.Token);
        jwt.Issuer.Should().Be(ValidIssuer, "el emisor debe provenir del JwtOptions inyectado");
        jwt.Audiences.Should().Contain(ValidAudience, "la audiencia debe provenir del JwtOptions inyectado");
    }
}
