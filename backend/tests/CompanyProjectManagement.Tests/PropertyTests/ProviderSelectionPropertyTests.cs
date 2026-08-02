using CompanyProjectManagement.Infrastructure.Data;
using CompanyProjectManagement.Infrastructure.Extensions;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CompanyProjectManagement.Tests.PropertyTests;

/// <summary>
/// Property 1: Provider selection determinism
/// 
/// For any valid provider name in {"SqlServer", "PostgreSQL"} with a matching non-empty connection string,
/// AddDatabaseProvider configures the DbContext with the correct EF Core provider.
/// 
/// **Validates: Requirements 1.1, 1.2, 2.3**
/// </summary>
public class ProviderSelectionPropertyTests
{
    private static readonly Dictionary<string, string> ExpectedProviderNames = new()
    {
        ["SqlServer"] = "Microsoft.EntityFrameworkCore.SqlServer",
        ["PostgreSQL"] = "Npgsql.EntityFrameworkCore.PostgreSQL"
    };

    /// <summary>
    /// For any valid provider name in {"SqlServer", "PostgreSQL"} with a matching non-empty connection string,
    /// AddDatabaseProvider configures the DbContext with the correct EF Core provider.
    /// **Validates: Requirements 1.1, 1.2, 2.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ValidProvider_ConfiguresCorrectEfCoreProvider()
    {
        var providerGen = Gen.OneOf(
            Gen.Constant("SqlServer"),
            Gen.Constant("PostgreSQL"));

        var connectionStringGen = Gen.Choose(1, 100)
            .SelectMany(len => Gen.ArrayOf(Gen.Choose(33, 126).Select(i => (char)i), len))
            .Select(chars => new string(chars));

        var gen = from provider in providerGen
                  from connStr in connectionStringGen
                  select (provider, connStr);

        return Prop.ForAll(gen.ToArbitrary(), tuple =>
        {
            var (provider, connectionString) = tuple;

            var configData = new Dictionary<string, string?>
            {
                ["DatabaseProvider"] = provider,
                [$"ConnectionStrings:{provider}"] = connectionString
            };

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(configData)
                .Build();

            var services = new ServiceCollection();
            services.AddDatabaseProvider(configuration);

            using var serviceProvider = services.BuildServiceProvider();
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            context.Database.ProviderName.Should().Be(ExpectedProviderNames[provider],
                $"provider '{provider}' should configure EF Core with '{ExpectedProviderNames[provider]}'");
        });
    }
}
