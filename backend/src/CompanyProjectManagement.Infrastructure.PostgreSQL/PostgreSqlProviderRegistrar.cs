using CompanyProjectManagement.Infrastructure.Common.Providers;
using Microsoft.EntityFrameworkCore;

namespace CompanyProjectManagement.Infrastructure.PostgreSQL;

/// <summary>
/// Configures Entity Framework Core to use the PostgreSQL (Npgsql) provider.
/// Migrations are kept in this assembly via <c>MigrationsAssembly</c>.
/// </summary>
public sealed class PostgreSqlProviderRegistrar : IDatabaseProviderRegistrar
{
    public string ProviderName => "PostgreSQL";

    public void Configure(DbContextOptionsBuilder options, string connectionString)
    {
        options.UseNpgsql(connectionString, npgsql =>
        {
            npgsql.MigrationsAssembly(typeof(PostgreSqlProviderRegistrar).Assembly.FullName);
            npgsql.MigrationsHistoryTable("__EFMigrationsHistory");
        })
        .UseSnakeCaseNamingConvention();
    }
}
