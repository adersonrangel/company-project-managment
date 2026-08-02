using CompanyProjectManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CompanyProjectManagement.Infrastructure.Extensions;

public static class DatabaseServiceExtensions
{
    private static readonly string[] SupportedProviders = ["SqlServer", "PostgreSQL"];

    public static IServiceCollection AddDatabaseProvider(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var provider = configuration["DatabaseProvider"] ?? "SqlServer";

        if (!SupportedProviders.Contains(provider))
            throw new InvalidOperationException(
                $"Unsupported database provider: '{provider}'. Valid providers: {string.Join(", ", SupportedProviders)}");

        var connectionString = configuration.GetConnectionString(provider);

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException(
                $"Connection string '{provider}' is missing or empty for the configured database provider '{provider}'.");

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            switch (provider)
            {
                case "PostgreSQL":
                    options.UseNpgsql(connectionString, npgsql =>
                        npgsql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));
                    break;
                case "SqlServer":
                    options.UseSqlServer(connectionString, sql =>
                        sql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));
                    break;
            }
        });

        return services;
    }
}
