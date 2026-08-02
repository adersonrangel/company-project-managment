using CompanyProjectManagement.Infrastructure.Data;
using CompanyProjectManagement.Infrastructure.Extensions;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CompanyProjectManagement.Tests.Infrastructure;

/// <summary>
/// Unit tests for DatabaseServiceExtensions.AddDatabaseProvider.
/// Validates: Requirements 1.1, 1.2, 2.4
/// </summary>
public class DatabaseServiceExtensionsTests
{
    [Fact]
    public void AddDatabaseProvider_WhenDatabaseProviderKeyIsMissing_DefaultsToSqlServer()
    {
        // Arrange - no "DatabaseProvider" key, only a SqlServer connection string
        var configData = new Dictionary<string, string?>
        {
            ["ConnectionStrings:SqlServer"] = "Server=localhost;Database=TestDb;TrustServerCertificate=True;"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        var services = new ServiceCollection();

        // Act
        services.AddDatabaseProvider(configuration);

        // Assert
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        context.Database.ProviderName.Should().Be("Microsoft.EntityFrameworkCore.SqlServer");
    }

    [Fact]
    public void AddDatabaseProvider_WhenDatabaseProviderKeyIsNull_DefaultsToSqlServer()
    {
        // Arrange - "DatabaseProvider" key is explicitly null
        var configData = new Dictionary<string, string?>
        {
            ["DatabaseProvider"] = null,
            ["ConnectionStrings:SqlServer"] = "Server=localhost;Database=TestDb;TrustServerCertificate=True;"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        var services = new ServiceCollection();

        // Act
        services.AddDatabaseProvider(configuration);

        // Assert
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        context.Database.ProviderName.Should().Be("Microsoft.EntityFrameworkCore.SqlServer");
    }

    [Fact]
    public void AddDatabaseProvider_WithPostgreSQLProvider_RegistersNpgsqlProvider()
    {
        // Arrange
        var configData = new Dictionary<string, string?>
        {
            ["DatabaseProvider"] = "PostgreSQL",
            ["ConnectionStrings:PostgreSQL"] = "Host=localhost;Port=5432;Database=TestDb;Username=postgres;Password=postgres;"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        var services = new ServiceCollection();

        // Act
        services.AddDatabaseProvider(configuration);

        // Assert
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        context.Database.ProviderName.Should().Be("Npgsql.EntityFrameworkCore.PostgreSQL");
    }

    [Fact]
    public void AddDatabaseProvider_WithSqlServerProvider_RegistersSqlServerProvider()
    {
        // Arrange
        var configData = new Dictionary<string, string?>
        {
            ["DatabaseProvider"] = "SqlServer",
            ["ConnectionStrings:SqlServer"] = "Server=localhost,1433;Database=TestDb;User Id=sa;Password=Test123;TrustServerCertificate=True;"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        var services = new ServiceCollection();

        // Act
        services.AddDatabaseProvider(configuration);

        // Assert
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        context.Database.ProviderName.Should().Be("Microsoft.EntityFrameworkCore.SqlServer");
    }
}
