using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace CompanyProjectManagement.Infrastructure.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    private static readonly string[] ValidProviders = ["SqlServer", "PostgreSQL"];

    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var configuration = BuildConfiguration();
        var provider = ResolveProvider(args, configuration);
        var connectionString = configuration.GetConnectionString(provider)
            ?? throw new InvalidOperationException($"Connection string '{provider}' not found in configuration.");

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

        switch (provider)
        {
            case "PostgreSQL":
                optionsBuilder.UseNpgsql(connectionString,
                    npgsql => npgsql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));
                break;
            default: // SqlServer
                optionsBuilder.UseSqlServer(connectionString,
                    sql => sql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));
                break;
        }

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
            return ValidProviders.Contains(value) ? value : "SqlServer";
        }

        // Fall back to configuration
        var configProvider = configuration["DatabaseProvider"];
        if (configProvider is not null && ValidProviders.Contains(configProvider))
        {
            return configProvider;
        }

        return "SqlServer";
    }
}
