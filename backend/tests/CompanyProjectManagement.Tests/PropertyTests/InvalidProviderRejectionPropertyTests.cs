using CompanyProjectManagement.Infrastructure.Extensions;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CompanyProjectManagement.Tests.PropertyTests;

/// <summary>
/// Property 2: Invalid provider rejection with descriptive message
/// 
/// For any string that is not exactly "SqlServer" or "PostgreSQL" (case-sensitive),
/// when used as the DatabaseProvider configuration value, AddDatabaseProvider throws
/// an InvalidOperationException whose message contains both the invalid value and the
/// list of valid providers.
/// 
/// **Validates: Requirements 1.3**
/// </summary>
public class InvalidProviderRejectionPropertyTests
{
    private static readonly string[] ValidProviders = ["SqlServer", "PostgreSQL"];

    /// <summary>
    /// For any string that is not "SqlServer" or "PostgreSQL", AddDatabaseProvider
    /// throws InvalidOperationException containing the invalid value and valid providers list.
    /// **Validates: Requirements 1.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property InvalidProvider_ThrowsWithDescriptiveMessage()
    {
        var invalidProviderGen = Gen.Choose(1, 50)
            .SelectMany(len => Gen.ArrayOf(Gen.Choose(32, 126).Select(i => (char)i), len))
            .Select(chars => new string(chars))
            .Where(s => s != "SqlServer" && s != "PostgreSQL");

        return Prop.ForAll(invalidProviderGen.ToArbitrary(), invalidProvider =>
        {
            var configData = new Dictionary<string, string?>
            {
                ["DatabaseProvider"] = invalidProvider
            };

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(configData)
                .Build();

            var services = new ServiceCollection();

            var act = () => services.AddDatabaseProvider(configuration);

            var exception = act.Should().Throw<InvalidOperationException>().Which;

            exception.Message.Should().Contain(invalidProvider,
                $"exception message should contain the invalid provider value '{invalidProvider}'");
            exception.Message.Should().Contain("SqlServer",
                "exception message should list 'SqlServer' as a valid provider");
            exception.Message.Should().Contain("PostgreSQL",
                "exception message should list 'PostgreSQL' as a valid provider");
        });
    }
}
