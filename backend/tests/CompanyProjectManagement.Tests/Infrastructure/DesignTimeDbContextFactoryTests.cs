using System.Reflection;
using CompanyProjectManagement.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace CompanyProjectManagement.Tests.Infrastructure;

/// <summary>
/// Unit tests for DesignTimeDbContextFactory provider resolution logic.
/// Validates: Requirements 4.2, 4.3, 4.4
/// </summary>
public class DesignTimeDbContextFactoryTests
{
    private static readonly MethodInfo ResolveProviderMethod =
        typeof(DesignTimeDbContextFactory).GetMethod(
            "ResolveProvider",
            BindingFlags.NonPublic | BindingFlags.Static)!;

    private static string InvokeResolveProvider(string[] args, IConfiguration configuration)
    {
        return (string)ResolveProviderMethod.Invoke(null, [args, configuration])!;
    }

    private static IConfiguration BuildTestConfiguration(string? databaseProvider = null)
    {
        var configData = new Dictionary<string, string?>();

        if (databaseProvider is not null)
        {
            configData["DatabaseProvider"] = databaseProvider;
        }

        configData["ConnectionStrings:SqlServer"] = "Server=localhost;Database=Test;";
        configData["ConnectionStrings:PostgreSQL"] = "Host=localhost;Database=Test;";

        return new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();
    }

    [Fact]
    public void ResolveProvider_WithExplicitSqlServerArg_ReturnsSqlServer()
    {
        // Arrange
        var args = new[] { "--provider=SqlServer" };
        var configuration = BuildTestConfiguration("PostgreSQL");

        // Act
        var result = InvokeResolveProvider(args, configuration);

        // Assert - CLI arg takes precedence over config
        result.Should().Be("SqlServer");
    }

    [Fact]
    public void ResolveProvider_WithExplicitPostgreSQLArg_ReturnsPostgreSQL()
    {
        // Arrange
        var args = new[] { "--provider=PostgreSQL" };
        var configuration = BuildTestConfiguration("SqlServer");

        // Act
        var result = InvokeResolveProvider(args, configuration);

        // Assert - CLI arg takes precedence over config
        result.Should().Be("PostgreSQL");
    }

    [Fact]
    public void ResolveProvider_WithoutProviderArg_DefaultsToSqlServer()
    {
        // Arrange - no --provider= argument, no DatabaseProvider in config
        var args = Array.Empty<string>();
        var configuration = BuildTestConfiguration();

        // Act
        var result = InvokeResolveProvider(args, configuration);

        // Assert
        result.Should().Be("SqlServer");
    }

    [Fact]
    public void ResolveProvider_WithInvalidProviderArg_DefaultsToSqlServer()
    {
        // Arrange - invalid provider value
        var args = new[] { "--provider=MySQL" };
        var configuration = BuildTestConfiguration();

        // Act
        var result = InvokeResolveProvider(args, configuration);

        // Assert - invalid provider falls back to SqlServer
        result.Should().Be("SqlServer");
    }

    [Fact]
    public void ResolveProvider_WithProviderArgAmongOtherArgs_ResolvesCorrectly()
    {
        // Arrange - --provider= mixed with other args
        var args = new[] { "--verbose", "--output=bin", "--provider=PostgreSQL", "--configuration=Release" };
        var configuration = BuildTestConfiguration("SqlServer");

        // Act
        var result = InvokeResolveProvider(args, configuration);

        // Assert - should find --provider= regardless of position
        result.Should().Be("PostgreSQL");
    }

    [Fact]
    public void ResolveProvider_WithEmptyProviderValue_DefaultsToSqlServer()
    {
        // Arrange - --provider= with empty value
        var args = new[] { "--provider=" };
        var configuration = BuildTestConfiguration();

        // Act
        var result = InvokeResolveProvider(args, configuration);

        // Assert - empty value is not a valid provider, defaults to SqlServer
        result.Should().Be("SqlServer");
    }

    [Fact]
    public void ResolveProvider_WithNoArgsButConfigHasPostgreSQL_ReturnsPostgreSQL()
    {
        // Arrange - no CLI arg, but config says PostgreSQL
        var args = Array.Empty<string>();
        var configuration = BuildTestConfiguration("PostgreSQL");

        // Act
        var result = InvokeResolveProvider(args, configuration);

        // Assert - falls back to configuration value
        result.Should().Be("PostgreSQL");
    }

    [Fact]
    public void ResolveProvider_WithCaseSensitiveProviderArg_DefaultsToSqlServer()
    {
        // Arrange - provider value with wrong casing
        var args = new[] { "--provider=postgresql" };
        var configuration = BuildTestConfiguration();

        // Act
        var result = InvokeResolveProvider(args, configuration);

        // Assert - case-sensitive comparison, "postgresql" is not valid
        result.Should().Be("SqlServer");
    }
}
