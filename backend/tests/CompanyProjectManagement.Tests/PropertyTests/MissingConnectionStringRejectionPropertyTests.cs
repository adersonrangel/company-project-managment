using CompanyProjectManagement.Infrastructure.Extensions;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CompanyProjectManagement.Tests.PropertyTests;

/// <summary>
/// Property 3: Missing connection string rejection with descriptive message
/// 
/// For any valid provider name in {"SqlServer", "PostgreSQL"}, when the configuration
/// does not contain a connection string entry with that key (or the value is null/whitespace),
/// AddDatabaseProvider throws an InvalidOperationException whose message contains both the
/// missing key name and the provider name.
/// 
/// **Validates: Requirements 1.4**
/// </summary>
public class MissingConnectionStringRejectionPropertyTests
{
    /// <summary>
    /// For any valid provider name with no matching connection string entry,
    /// AddDatabaseProvider throws InvalidOperationException with provider name in message.
    /// **Validates: Requirements 1.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property MissingConnectionString_ThrowsWithProviderNameInMessage()
    {
        var providerGen = Gen.OneOf(
            Gen.Constant("SqlServer"),
            Gen.Constant("PostgreSQL"));

        return Prop.ForAll(providerGen.ToArbitrary(), provider =>
        {
            // Configuration with DatabaseProvider set but NO connection string entry
            var configData = new Dictionary<string, string?>
            {
                ["DatabaseProvider"] = provider
            };

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(configData)
                .Build();

            var services = new ServiceCollection();

            var act = () => services.AddDatabaseProvider(configuration);

            var exception = act.Should().Throw<InvalidOperationException>().Which;

            exception.Message.Should().Contain(provider,
                $"exception message should contain the provider name '{provider}'");
        });
    }

    /// <summary>
    /// For any valid provider name with a null/whitespace connection string value,
    /// AddDatabaseProvider throws InvalidOperationException with provider name in message.
    /// **Validates: Requirements 1.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property NullOrWhitespaceConnectionString_ThrowsWithProviderNameInMessage()
    {
        var providerGen = Gen.OneOf(
            Gen.Constant("SqlServer"),
            Gen.Constant("PostgreSQL"));

        var whitespaceGen = Gen.OneOf(
            Gen.Constant(""),
            Gen.Constant(" "),
            Gen.Constant("   "),
            Gen.Constant("\t"),
            Gen.Constant("\n"));

        var gen = from provider in providerGen
                  from whitespace in whitespaceGen
                  select (provider, whitespace);

        return Prop.ForAll(gen.ToArbitrary(), tuple =>
        {
            var (provider, whitespace) = tuple;

            // Configuration with DatabaseProvider set and connection string as whitespace
            var configData = new Dictionary<string, string?>
            {
                ["DatabaseProvider"] = provider,
                [$"ConnectionStrings:{provider}"] = whitespace
            };

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(configData)
                .Build();

            var services = new ServiceCollection();

            var act = () => services.AddDatabaseProvider(configuration);

            var exception = act.Should().Throw<InvalidOperationException>().Which;

            exception.Message.Should().Contain(provider,
                $"exception message should contain the provider name '{provider}'");
        });
    }
}
