using CompanyProjectManagement.Infrastructure.Providers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace CompanyProjectManagement.Infrastructure.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var configuration = BuildConfiguration();
        var provider = ResolveProvider(args, configuration);
        var connectionString = configuration.GetConnectionString(provider)
            ?? throw new InvalidOperationException($"Connection string '{provider}' not found in configuration.");

        var registrar = DatabaseProviderRegistry.Find(provider)
            ?? throw new InvalidOperationException(
                $"Unsupported database provider: '{provider}'. Valid providers: {string.Join(", ", DatabaseProviderRegistry.SupportedProviders)}");

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        registrar.Configure(optionsBuilder, connectionString);

        return new ApplicationDbContext(optionsBuilder.Options);
    }

    private static IConfiguration BuildConfiguration()
    {
        var basePath = Path.Combine(Directory.GetCurrentDirectory(), "../CompanyProjectManagement.Api");

        return new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();
    }

    private static string ResolveProvider(string[] args, IConfiguration configuration)
    {
        // CLI argument takes precedence
        var providerArg = args.FirstOrDefault(a => a.StartsWith("--provider="));
        if (providerArg is not null)
        {
            var value = providerArg.Split('=', 2)[1];
            return DatabaseProviderRegistry.Find(value) is not null ? value : "SqlServer";
        }

        // Fall back to configuration
        var configProvider = configuration["DatabaseProvider"];
        if (configProvider is not null && DatabaseProviderRegistry.Find(configProvider) is not null)
        {
            return configProvider;
        }

        return "SqlServer";
    }
}
