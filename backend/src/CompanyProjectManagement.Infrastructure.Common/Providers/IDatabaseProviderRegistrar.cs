using Microsoft.EntityFrameworkCore;

namespace CompanyProjectManagement.Infrastructure.Common.Providers;

/// <summary>
/// Contract implemented by each database provider assembly (SqlServer, PostgreSQL).
/// The orchestrator (CompanyProjectManagement.Infrastructure) keeps an explicit list of
/// registrars and selects one by <see cref="ProviderName"/> at runtime and at design time.
///
/// Each implementation is responsible for configuring the provider-specific options,
/// including pointing <c>MigrationsAssembly</c> to its own assembly so that migrations
/// stay isolated per provider.
/// </summary>
public interface IDatabaseProviderRegistrar
{
    /// <summary>
    /// The provider key as used by the <c>DatabaseProvider</c> configuration value
    /// and the <c>--provider=</c> design-time argument (e.g. "SqlServer", "PostgreSQL").
    /// </summary>
    string ProviderName { get; }

    /// <summary>
    /// Applies the provider-specific configuration onto the given options builder,
    /// wiring the connection string and the provider's own migrations assembly.
    /// </summary>
    void Configure(DbContextOptionsBuilder options, string connectionString);
}
