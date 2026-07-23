using CompanyProjectManagement.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CompanyProjectManagement.Tests.Infrastructure;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"TestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove ALL DbContext-related registrations to avoid provider conflicts.
            // EF Core 10 requires exactly one provider per service provider.
            var descriptorsToRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>)
                    || d.ServiceType == typeof(DbContextOptions)
                    || d.ServiceType == typeof(ApplicationDbContext)
                    || (d.ServiceType.FullName?.Contains("EntityFrameworkCore") == true)
                    || (d.ServiceType.FullName?.Contains("SqlServer") == true)
                    || (d.ImplementationType?.FullName?.Contains("SqlServer") == true)
                    || (d.ImplementationType?.FullName?.Contains("EntityFrameworkCore") == true))
                .ToList();

            foreach (var descriptor in descriptorsToRemove)
            {
                services.Remove(descriptor);
            }

            // Add InMemory database for testing with a unique name per factory instance
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
            });
        });

        builder.UseEnvironment("Testing");
    }
}
