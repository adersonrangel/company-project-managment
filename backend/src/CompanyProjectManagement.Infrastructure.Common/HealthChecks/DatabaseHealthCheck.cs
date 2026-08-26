using CompanyProjectManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CompanyProjectManagement.Infrastructure.HealthChecks;

public static class DatabaseHealthCheck
{
    public static async Task ValidateConnectivityAsync(
        IServiceProvider services,
        IConfiguration configuration,
        ILogger logger)
    {
        var provider = configuration["DatabaseProvider"] ?? "SqlServer";

        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));

        try
        {
            var canConnect = await context.Database.CanConnectAsync(cts.Token);
            if (canConnect)
            {
                logger.LogInformation("Database connectivity validated. Provider: {Provider}", provider);
            }
            else
            {
                logger.LogWarning("Database connectivity check failed. Provider: {Provider}", provider);
            }
        }
        catch (Exception ex) when (ex is OperationCanceledException or TaskCanceledException)
        {
            logger.LogWarning("Database connectivity check timed out after 5 seconds. Provider: {Provider}", provider);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Database connectivity check failed. Provider: {Provider}, Error: {Error}", provider, ex.Message);
        }
    }
}
