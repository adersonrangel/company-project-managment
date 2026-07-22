using CompanyProjectManagement.Api.Middleware;
using CompanyProjectManagement.Application.Services;
using CompanyProjectManagement.Application.Validators;
using CompanyProjectManagement.Domain.Repositories;
using CompanyProjectManagement.Infrastructure.Data;
using CompanyProjectManagement.Infrastructure.Data.Repositories;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add controllers
builder.Services.AddControllers();

// Configure OpenAPI
builder.Services.AddOpenApi();

// Configure DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register repositories
builder.Services.AddScoped<IEmpresaRepository, EmpresaRepository>();
builder.Services.AddScoped<IProyectoRepository, ProyectoRepository>();

// Register services
builder.Services.AddScoped<IEmpresaService, EmpresaService>();
builder.Services.AddScoped<IProyectoService, ProyectoService>();

// Register FluentValidation validators from assembly
builder.Services.AddValidatorsFromAssemblyContaining<CrearEmpresaValidator>();

var app = builder.Build();

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
