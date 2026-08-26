using CompanyProjectManagement.Infrastructure.Data;
using CompanyProjectManagement.Infrastructure.Providers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CompanyProjectManagement.Infrastructure.Extensions;

public static class DatabaseServiceExtensions
{
    public static IServiceCollection AddDatabaseProvider(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var provider = configuration["DatabaseProvider"] ?? "SqlServer";

        var registrar = DatabaseProviderRegistry.Find(provider)
            ?? throw new InvalidOperationException(
                $"Unsupported database provider: '{provider}'. Valid providers: {string.Join(", ", DatabaseProviderRegistry.SupportedProviders)}");

        var connectionString = configuration.GetConnectionString(provider);

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException(
                $"Connection string '{provider}' is missing or empty for the configured database provider '{provider}'.");

        services.AddDbContext<ApplicationDbContext>(options =>
            registrar.Configure(options, connectionString));

        return services;
    }
}
