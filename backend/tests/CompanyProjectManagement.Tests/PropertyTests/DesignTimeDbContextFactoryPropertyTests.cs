using System.Reflection;
using CompanyProjectManagement.Infrastructure.Data;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.Configuration;

namespace CompanyProjectManagement.Tests.PropertyTests;

/// <summary>
/// Property 4: DesignTimeDbContextFactory provider argument resolution
/// 
/// For any string array containing `--provider=X` where X is in {"SqlServer", "PostgreSQL"},
/// the factory resolves provider X. For any string array without a valid `--provider=` argument
/// (missing, empty, or invalid value), the factory defaults to SqlServer.
/// 
/// **Validates: Requirements 4.2, 4.3, 4.4**
/// </summary>
public class DesignTimeDbContextFactoryPropertyTests
{
    private static readonly string[] ValidProviders = ["SqlServer", "PostgreSQL"];

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

    /// <summary>
    /// Generator for arbitrary strings that do NOT start with "--provider=".
    /// Used to create noise arguments that should not affect provider resolution.
    /// </summary>
    private static Gen<string> NoiseArgGen()
    {
        return Gen.OneOf(
            Gen.Constant("--verbose"),
            Gen.Constant("--output=bin"),
            Gen.Constant("--configuration=Release"),
            Gen.Constant("somearg"),
            Gen.Choose(1, 30)
                .SelectMany(len => Gen.ArrayOf(Gen.Choose(33, 126).Select(i => (char)i), len))
                .Select(chars => new string(chars))
                .Where(s => !s.StartsWith("--provider=")));
    }

    /// <summary>
    /// For any string array containing --provider=X where X is a valid provider,
    /// ResolveProvider returns that provider regardless of other args in the array.
    /// **Validates: Requirements 4.2, 4.3, 4.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ValidProviderArg_ResolvesToSpecifiedProvider()
    {
        var providerGen = Gen.OneOf(
            Gen.Constant("SqlServer"),
            Gen.Constant("PostgreSQL"));

        var noiseArgsGen = Gen.ArrayOf(NoiseArgGen());

        var insertionIndexGen = Gen.Choose(0, 10);

        var gen = from provider in providerGen
                  from noiseArgs in noiseArgsGen
                  from insertIdx in insertionIndexGen
                  select (provider, noiseArgs, insertIdx);

        return Prop.ForAll(gen.ToArbitrary(), tuple =>
        {
            var (provider, noiseArgs, insertIdx) = tuple;

            // Insert --provider=X at a valid position within the array
            var argsList = noiseArgs.ToList();
            var actualIdx = Math.Min(insertIdx, argsList.Count);
            argsList.Insert(actualIdx, $"--provider={provider}");
            var args = argsList.ToArray();

            // Use a config that defaults to a different provider to confirm CLI takes precedence
            var fallbackProvider = provider == "SqlServer" ? "PostgreSQL" : "SqlServer";
            var configuration = BuildTestConfiguration(fallbackProvider);

            var resolved = InvokeResolveProvider(args, configuration);

            resolved.Should().Be(provider,
                $"--provider={provider} in args should resolve to '{provider}' regardless of config fallback");
        });
    }

    /// <summary>
    /// For any string array without a valid --provider= entry (no --provider= at all,
    /// or --provider= with an invalid value), ResolveProvider defaults to SqlServer
    /// when the configuration also specifies SqlServer.
    /// **Validates: Requirements 4.2, 4.3, 4.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property NoValidProviderArg_DefaultsToSqlServer()
    {
        // Generate arrays of noise args (none start with --provider=)
        var noiseOnlyArgsGen = Gen.ArrayOf(NoiseArgGen());

        // Generate arrays that may contain --provider= but with invalid values
        var invalidProviderValueGen = Gen.Choose(1, 30)
            .SelectMany(len => Gen.ArrayOf(Gen.Choose(33, 126).Select(i => (char)i), len))
            .Select(chars => new string(chars))
            .Where(s => s != "SqlServer" && s != "PostgreSQL");

        var argsWithInvalidProviderGen = from noiseArgs in noiseOnlyArgsGen
                                         from invalidValue in invalidProviderValueGen
                                         from insertIdx in Gen.Choose(0, 10)
                                         select (noiseArgs, invalidValue, insertIdx);

        // Combine: either no --provider= at all, or --provider=InvalidValue
        var gen = Gen.OneOf(
            noiseOnlyArgsGen.Select(args => (string[])args),
            argsWithInvalidProviderGen.Select(tuple =>
            {
                var (noiseArgs, invalidValue, insertIdx) = tuple;
                var argsList = noiseArgs.ToList();
                var actualIdx = Math.Min(insertIdx, argsList.Count);
                argsList.Insert(actualIdx, $"--provider={invalidValue}");
                return argsList.ToArray();
            }));

        return Prop.ForAll(gen.ToArbitrary(), args =>
        {
            // Configuration defaults to SqlServer
            var configuration = BuildTestConfiguration("SqlServer");

            var resolved = InvokeResolveProvider(args, configuration);

            resolved.Should().Be("SqlServer",
                "without a valid --provider= argument, resolution should default to SqlServer");
        });
    }
}
