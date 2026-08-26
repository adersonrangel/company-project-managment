using CompanyProjectManagement.Infrastructure.Common.Providers;
using Microsoft.EntityFrameworkCore;

namespace CompanyProjectManagement.Infrastructure.SqlServer;

/// <summary>
/// Configures Entity Framework Core to use the SQL Server provider.
/// Migrations are kept in this assembly via <c>MigrationsAssembly</c>.
/// </summary>
public sealed class SqlServerProviderRegistrar : IDatabaseProviderRegistrar
{
    public string ProviderName => "SqlServer";

    public void Configure(DbContextOptionsBuilder options, string connectionString)
    {
        options.UseSqlServer(connectionString, sql =>
            sql.MigrationsAssembly(typeof(SqlServerProviderRegistrar).Assembly.FullName));
    }
}
