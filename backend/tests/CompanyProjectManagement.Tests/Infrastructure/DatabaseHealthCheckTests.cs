using CompanyProjectManagement.Infrastructure.Data;
using CompanyProjectManagement.Infrastructure.HealthChecks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace CompanyProjectManagement.Tests.Infrastructure;

/// <summary>
/// Unit tests for DatabaseHealthCheck.ValidateConnectivityAsync.
/// Validates: Requirements 7.2, 7.3, 7.4
/// </summary>
public class DatabaseHealthCheckTests
{
    [Fact]
    public async Task ValidateConnectivityAsync_WhenConnectionSucceeds_LogsInformation()
    {
        // Arrange - InMemory provider always returns true for CanConnectAsync
        var configuration = BuildConfiguration("SqlServer");
        var services = BuildServiceProviderWithInMemoryDb();
        var logger = Substitute.For<ILogger>();

        // Act
        await DatabaseHealthCheck.ValidateConnectivityAsync(services, configuration, logger);

        // Assert - should log Information with provider name
        logger.Received(1).Log(
            LogLevel.Information,
            Arg.Any<EventId>(),
            Arg.Is<object>(o => o.ToString()!.Contains("SqlServer")),
            Arg.Any<Exception?>(),
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Fact]
    public async Task ValidateConnectivityAsync_WhenConnectionSucceeds_LogMessageContainsProviderName()
    {
        // Arrange - use PostgreSQL as provider name to verify it appears in the log
        var configuration = BuildConfiguration("PostgreSQL");
        var services = BuildServiceProviderWithInMemoryDb();
        var logger = Substitute.For<ILogger>();

        // Act
        await DatabaseHealthCheck.ValidateConnectivityAsync(services, configuration, logger);

        // Assert - should log Information containing the provider name "PostgreSQL"
        logger.Received(1).Log(
            LogLevel.Information,
            Arg.Any<EventId>(),
            Arg.Is<object>(o => o.ToString()!.Contains("PostgreSQL")),
            Arg.Any<Exception?>(),
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Fact]
    public async Task ValidateConnectivityAsync_WhenConnectionThrowsException_LogsWarning()
    {
        // Arrange
        var configuration = BuildConfiguration("SqlServer");
        var exception = new InvalidOperationException("Connection refused");
        var services = BuildServiceProviderWithThrowingCreator(exception);
        var logger = Substitute.For<ILogger>();

        // Act
        await DatabaseHealthCheck.ValidateConnectivityAsync(services, configuration, logger);

        // Assert - should log Warning with provider name
        logger.Received(1).Log(
            LogLevel.Warning,
            Arg.Any<EventId>(),
            Arg.Is<object>(o => o.ToString()!.Contains("SqlServer")),
            Arg.Any<Exception?>(),
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Fact]
    public async Task ValidateConnectivityAsync_WhenConnectionTimesOut_LogsWarning()
    {
        // Arrange - OperationCanceledException simulates timeout
        var configuration = BuildConfiguration("PostgreSQL");
        var exception = new OperationCanceledException("The operation was canceled.");
        var services = BuildServiceProviderWithThrowingCreator(exception);
        var logger = Substitute.For<ILogger>();

        // Act
        await DatabaseHealthCheck.ValidateConnectivityAsync(services, configuration, logger);

        // Assert - should log Warning about timeout with provider name
        logger.Received(1).Log(
            LogLevel.Warning,
            Arg.Any<EventId>(),
            Arg.Is<object>(o => o.ToString()!.Contains("PostgreSQL")),
            Arg.Any<Exception?>(),
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Fact]
    public async Task ValidateConnectivityAsync_WhenTaskCanceled_LogsTimeoutWarning()
    {
        // Arrange - TaskCanceledException is also caught by the timeout handler
        var configuration = BuildConfiguration("SqlServer");
        var exception = new TaskCanceledException("A task was canceled.");
        var services = BuildServiceProviderWithThrowingCreator(exception);
        var logger = Substitute.For<ILogger>();

        // Act
        await DatabaseHealthCheck.ValidateConnectivityAsync(services, configuration, logger);

        // Assert - should log Warning about timeout
        logger.Received(1).Log(
            LogLevel.Warning,
            Arg.Any<EventId>(),
            Arg.Is<object>(o => o.ToString()!.Contains("timed out")),
            Arg.Any<Exception?>(),
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Fact]
    public async Task ValidateConnectivityAsync_WhenConnectionFails_ApplicationContinuesStartup()
    {
        // Arrange - simulate failure
        var configuration = BuildConfiguration("SqlServer");
        var exception = new InvalidOperationException("Database unavailable");
        var services = BuildServiceProviderWithThrowingCreator(exception);
        var logger = Substitute.For<ILogger>();

        // Act - should NOT throw; method completes normally (application continues)
        var act = () => DatabaseHealthCheck.ValidateConnectivityAsync(services, configuration, logger);

        // Assert - Validates Requirement 7.3: continue startup after failure
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task ValidateConnectivityAsync_WhenTimeoutOccurs_ApplicationContinuesStartup()
    {
        // Arrange - simulate timeout
        var configuration = BuildConfiguration("PostgreSQL");
        var exception = new OperationCanceledException();
        var services = BuildServiceProviderWithThrowingCreator(exception);
        var logger = Substitute.For<ILogger>();

        // Act - should NOT throw; method completes normally (application continues)
        var act = () => DatabaseHealthCheck.ValidateConnectivityAsync(services, configuration, logger);

        // Assert - Validates Requirement 7.3: continue startup after timeout
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task ValidateConnectivityAsync_WhenProviderNotConfigured_DefaultsToSqlServerInLogMessage()
    {
        // Arrange - no DatabaseProvider key in configuration
        var configData = new Dictionary<string, string?>();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();
        var services = BuildServiceProviderWithInMemoryDb();
        var logger = Substitute.For<ILogger>();

        // Act
        await DatabaseHealthCheck.ValidateConnectivityAsync(services, configuration, logger);

        // Assert - should log with "SqlServer" as default provider
        logger.Received(1).Log(
            LogLevel.Information,
            Arg.Any<EventId>(),
            Arg.Is<object>(o => o.ToString()!.Contains("SqlServer")),
            Arg.Any<Exception?>(),
            Arg.Any<Func<object, Exception?, string>>());
    }

    #region Helper Methods

    private static IConfiguration BuildConfiguration(string provider)
    {
        var configData = new Dictionary<string, string?>
        {
            ["DatabaseProvider"] = provider
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();
    }

    private static ServiceProvider BuildServiceProviderWithInMemoryDb()
    {
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase($"HealthCheckTest_{Guid.NewGuid()}"));

        return services.BuildServiceProvider();
    }

    /// <summary>
    /// Creates a service provider where resolving ApplicationDbContext succeeds,
    /// but calling context.Database.CanConnectAsync() throws the specified exception.
    /// Uses UseSqlServer with ReplaceService to swap in a ThrowingRelationalDatabaseCreator.
    /// </summary>
    private static IServiceProvider BuildServiceProviderWithThrowingCreator(Exception exception)
    {
        // Set the exception via static field since EF Core's internal DI resolves the creator
        ThrowingRelationalDatabaseCreator.ExceptionToThrow = exception;

        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseSqlServer(
                "Server=localhost;Database=FakeDb;Trusted_Connection=True;TrustServerCertificate=True;");
            options.ReplaceService<IRelationalDatabaseCreator, ThrowingRelationalDatabaseCreator>();
        });

        return services.BuildServiceProvider();
    }

    /// <summary>
    /// Custom IRelationalDatabaseCreator that throws a configured exception on CanConnectAsync.
    /// For relational providers, CanConnectAsync delegates to IRelationalDatabaseCreator.
    /// Uses a static field because EF Core's internal service provider resolves this type.
    /// </summary>
    private sealed class ThrowingRelationalDatabaseCreator : IRelationalDatabaseCreator
    {
        internal static Exception ExceptionToThrow { get; set; } = new InvalidOperationException("Not configured");

        public ThrowingRelationalDatabaseCreator(
            RelationalDatabaseCreatorDependencies dependencies)
        {
            // EF Core requires this constructor signature for service resolution
        }

        public bool CanConnect() => throw ExceptionToThrow;
        public Task<bool> CanConnectAsync(CancellationToken cancellationToken = default) => throw ExceptionToThrow;
        public bool EnsureCreated() => true;
        public Task<bool> EnsureCreatedAsync(CancellationToken cancellationToken = default) => Task.FromResult(true);
        public bool EnsureDeleted() => true;
        public Task<bool> EnsureDeletedAsync(CancellationToken cancellationToken = default) => Task.FromResult(true);
        public bool Exists() => false;
        public Task<bool> ExistsAsync(CancellationToken cancellationToken = default) => Task.FromResult(false);
        public bool HasTables() => false;
        public Task<bool> HasTablesAsync(CancellationToken cancellationToken = default) => Task.FromResult(false);
        public void Create() { }
        public Task CreateAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public void Delete() { }
        public Task DeleteAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public void CreateTables() { }
        public Task CreateTablesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public string GenerateCreateScript() => string.Empty;
    }

    #endregion
}
