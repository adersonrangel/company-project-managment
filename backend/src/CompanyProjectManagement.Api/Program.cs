using CompanyProjectManagement.Api.Middleware;
using CompanyProjectManagement.Application.Services;
using CompanyProjectManagement.Application.Validators;
using CompanyProjectManagement.Domain.Repositories;
using CompanyProjectManagement.Infrastructure.Data.Repositories;
using CompanyProjectManagement.Infrastructure.Extensions;
using CompanyProjectManagement.Infrastructure.HealthChecks;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

// Add controllers
builder.Services.AddControllers();

// Configure OpenAPI
builder.Services.AddOpenApi();

// Configure database provider
builder.Services.AddDatabaseProvider(builder.Configuration);

// Register repositories
builder.Services.AddScoped<IEmpresaRepository, EmpresaRepository>();
builder.Services.AddScoped<IProyectoRepository, ProyectoRepository>();
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();

// Register services
builder.Services.AddScoped<IEmpresaService, EmpresaService>();
builder.Services.AddScoped<IProyectoService, ProyectoService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// Register FluentValidation validators from assembly
builder.Services.AddValidatorsFromAssemblyContaining<CrearEmpresaValidator>();

var app = builder.Build();

// Validate database connectivity at startup
await DatabaseHealthCheck.ValidateConnectivityAsync(app.Services, app.Configuration, app.Logger);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Add global exception handling middleware
app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseHttpsRedirection();

app.MapControllers();

app.Run();

// Make the Program class accessible for integration testing with WebApplicationFactory
public partial class Program { }
