using CompanyProjectManagement.Infrastructure.Common.Providers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace CompanyProjectManagement.Tests.Infrastructure;

/// <summary>
/// Validates that <see cref="IDatabaseProviderRegistrar"/> is implementable and that
/// its contract members (ProviderName and Configure) behave as documented.
/// </summary>
public class DatabaseProviderRegistrarTests
{
    private sealed class StubRegistrar : IDatabaseProviderRegistrar
    {
        public string ProviderName => "Stub";

        public bool ConfigureCalled { get; private set; }
        public string? ReceivedConnectionString { get; private set; }

        public void Configure(DbContextOptionsBuilder options, string connectionString)
        {
            ConfigureCalled = true;
            ReceivedConnectionString = connectionString;
            options.UseInMemoryDatabase("stub");
        }
    }

    [Fact]
    public void ProviderName_IsExposed()
    {
        var registrar = new StubRegistrar();

        registrar.ProviderName.Should().Be("Stub");
    }

    [Fact]
    public void Configure_ReceivesConnectionStringAndAppliesOptions()
    {
        var registrar = new StubRegistrar();
        var builder = new DbContextOptionsBuilder();

        registrar.Configure(builder, "connection-string");

        registrar.ConfigureCalled.Should().BeTrue();
        registrar.ReceivedConnectionString.Should().Be("connection-string");
        builder.Options.Extensions.Should().NotBeEmpty();
    }
}
