using CompanyProjectManagement.Application.Services;
using CompanyProjectManagement.Domain.Entities;
using CompanyProjectManagement.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CompanyProjectManagement.Tests.Infrastructure;

/// <summary>
/// Fábrica de aplicación web para pruebas de integración. Reemplaza el proveedor de base de
/// datos por una base en memoria, configura una sección <c>Jwt</c> de prueba (para satisfacer
/// la validación fail-fast de <c>Program.cs</c>) y siembra un usuario administrador cuyo hash y
/// sal se generan con <see cref="PasswordHasher"/> (nunca contraseña en texto plano).
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string TestSecretKey = "test-secret-key-with-at-least-32-bytes-of-length!!";
    public const string TestIssuer = "CompanyProjectManagement";
    public const string TestAudience = "CompanyProjectManagementClient";
    public const string SeededUsername = "admin";
    public const string SeededPassword = "Admin123!";
    public const int SeededUserId = 1;

    private readonly string _databaseName = $"TestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Configurar la sección Jwt de prueba antes de la construcción del host para que la
        // validación fail-fast de Program.cs disponga de SecretKey/Issuer/Audience.
        builder.UseSetting("Jwt:SecretKey", TestSecretKey);
        builder.UseSetting("Jwt:Issuer", TestIssuer);
        builder.UseSetting("Jwt:Audience", TestAudience);
        builder.UseSetting("Jwt:ExpirationMinutes", "60");

        builder.ConfigureServices(services =>
        {
            // Remove ALL DbContext-related registrations to avoid provider conflicts.
            // EF Core 10 requires exactly one provider per service provider.
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

            // Add InMemory database for testing with a unique name per factory instance
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
            });
        });

        builder.UseEnvironment("Testing");
    }

    /// <summary>
    /// Garantiza que el usuario administrador de prueba está sembrado en la base en memoria,
    /// con un hash/sal generados por <see cref="PasswordHasher"/> para <see cref="SeededPassword"/>.
    /// </summary>
    private void EnsureSeeded()
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        if (context.Usuarios.Any(u => u.Username == SeededUsername))
        {
            return;
        }

        var hasher = new PasswordHasher();
        var (hash, salt) = hasher.Hash(SeededPassword);

        context.Usuarios.Add(new Usuario
        {
            Id = SeededUserId,
            Username = SeededUsername,
            PasswordHash = hash,
            PasswordSalt = salt
        });
        context.SaveChanges();
    }

    /// <summary>
    /// Obtiene un JWT válido para el usuario administrador sembrado, generado por el
    /// <see cref="ITokenService"/> resuelto por DI (misma clave/emisor/audiencia de prueba).
    /// </summary>
    public Task<string> ObtenerTokenValidoAsync()
    {
        return Task.FromResult(GenerarTokenValido());
    }

    /// <summary>
    /// Genera un JWT válido (síncrono) para el usuario administrador sembrado.
    /// </summary>
    private string GenerarTokenValido()
    {
        EnsureSeeded();

        using var scope = Services.CreateScope();
        var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();
        var result = tokenService.GenerateToken(SeededUserId.ToString(), SeededUsername);
        return result.Token;
    }

    /// <summary>
    /// Crea un <see cref="HttpClient"/> que adjunta por defecto un JWT válido en la cabecera
    /// <c>Authorization</c>. Lo usan las pruebas de negocio (Empresa/Proyecto/Dashboard) cuyos
    /// endpoints ahora requieren autenticación (Req 3.7), sin alterar el flujo bajo prueba.
    /// </summary>
    public HttpClient CreateAuthenticatedClient()
    {
        var token = GenerarTokenValido();
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    protected override void ConfigureClient(HttpClient client)
    {
        // Asegurar la siembra del usuario administrador antes de que las pruebas creen clientes.
        EnsureSeeded();
        base.ConfigureClient(client);
    }
}
