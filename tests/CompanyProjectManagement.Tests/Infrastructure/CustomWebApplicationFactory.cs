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
            // Remove the ApplicationDbContext and its options registrations
            var dbContextDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (dbContextDescriptor != null)
                services.Remove(dbContextDescriptor);

            // Remove the generic DbContextOptions if registered
            var dbContextOptionsDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions));
            if (dbContextOptionsDescriptor != null)
                services.Remove(dbContextOptionsDescriptor);

            // Remove any SqlServer-specific IDbContextOptionsExtension registrations
            // by removing all services whose implementation type is from SqlServer
            var sqlServerDescriptors = services
                .Where(d => d.ServiceType.FullName?.Contains("SqlServer") == true
                         || d.ImplementationType?.FullName?.Contains("SqlServer") == true)
                .ToList();
            foreach (var descriptor in sqlServerDescriptors)
            {
                services.Remove(descriptor);
            }

            // Add InMemory database for testing with a fixed name per factory instance
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
            });
        });

        builder.UseEnvironment("Testing");
    }
}
