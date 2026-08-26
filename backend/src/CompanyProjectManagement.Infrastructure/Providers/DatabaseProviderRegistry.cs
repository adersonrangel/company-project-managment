using CompanyProjectManagement.Infrastructure.Common.Providers;
using CompanyProjectManagement.Infrastructure.PostgreSQL;
using CompanyProjectManagement.Infrastructure.SqlServer;

namespace CompanyProjectManagement.Infrastructure.Providers;

/// <summary>
/// Explicit list of the supported database provider registrars (Option A discovery).
/// The orchestrator references each provider assembly directly and resolves the
/// appropriate registrar by <see cref="IDatabaseProviderRegistrar.ProviderName"/>.
/// This works identically at runtime and at design time without DI or reflection.
/// </summary>
internal static class DatabaseProviderRegistry
{
    private static readonly IDatabaseProviderRegistrar[] Registrars =
    [
        new SqlServerProviderRegistrar(),
        new PostgreSqlProviderRegistrar(),
    ];

    /// <summary>The provider names supported by the application.</summary>
    public static IReadOnlyList<string> SupportedProviders { get; } =
        Registrars.Select(r => r.ProviderName).ToArray();

    /// <summary>
    /// Returns the registrar matching <paramref name="providerName"/>, or <c>null</c>
    /// when no supported provider matches.
    /// </summary>
    public static IDatabaseProviderRegistrar? Find(string providerName) =>
        Registrars.FirstOrDefault(r => r.ProviderName == providerName);
}
