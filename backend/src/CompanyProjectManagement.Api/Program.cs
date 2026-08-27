using System.Text;
using System.Text.Json;
using CompanyProjectManagement.Api.Middleware;
using CompanyProjectManagement.Application.DTOs.Responses;
using CompanyProjectManagement.Application.Options;
using CompanyProjectManagement.Application.Services;
using CompanyProjectManagement.Application.Validators;
using CompanyProjectManagement.Domain.Repositories;
using CompanyProjectManagement.Infrastructure.Data.Repositories;
using CompanyProjectManagement.Infrastructure.Extensions;
using CompanyProjectManagement.Infrastructure.HealthChecks;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add controllers
builder.Services.AddControllers();

// Configure OpenAPI
builder.Services.AddOpenApi();

// Configure database provider
builder.Services.AddDatabaseProvider(builder.Configuration);

// Bind and validate JWT configuration (fail-fast). The application must not start if
// SecretKey, Issuer or Audience are missing (Req 2.5, 2.6).
var jwtOptions = new JwtOptions();
builder.Configuration.GetSection(JwtOptions.SectionName).Bind(jwtOptions);
ValidateJwtOptions(jwtOptions);

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));

// Configure JWT Bearer authentication (Req 3.1, 3.4, 3.5).
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey)),
            ClockSkew = TimeSpan.Zero
        };

        // Req 3.2-3.5: uniformar el cuerpo del 401 con ErrorResponse indicando el motivo.
        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                // Evitar la respuesta 401 por defecto (cabecera WWW-Authenticate sin cuerpo).
                context.HandleResponse();

                var motivo = DeterminarMotivo401(context);

                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";

                var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
                await context.Response.WriteAsJsonAsync(new ErrorResponse(motivo), jsonOptions);
            }
        };
    });

builder.Services.AddAuthorization();

// Register repositories
builder.Services.AddScoped<IEmpresaRepository, EmpresaRepository>();
builder.Services.AddScoped<IProyectoRepository, ProyectoRepository>();
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();

// Register services
builder.Services.AddScoped<IEmpresaService, EmpresaService>();
builder.Services.AddScoped<IProyectoService, ProyectoService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITokenService, JwtTokenService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();

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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Valida la configuración JWT al arranque; si falta un parámetro, lanza una excepción cuyo
// mensaje nombra el parámetro ausente e impide el arranque de la aplicación (Req 2.5, 2.6).
static void ValidateJwtOptions(JwtOptions options)
{
    if (string.IsNullOrWhiteSpace(options.SecretKey))
    {
        throw new InvalidOperationException(
            "La configuración JWT es inválida: falta el parámetro 'Jwt:SecretKey'. " +
            "Proporcione la clave secreta de firma vía user-secrets o variable de entorno.");
    }

    if (string.IsNullOrWhiteSpace(options.Issuer))
    {
        throw new InvalidOperationException(
            "La configuración JWT es inválida: falta el parámetro 'Jwt:Issuer'.");
    }

    if (string.IsNullOrWhiteSpace(options.Audience))
    {
        throw new InvalidOperationException(
            "La configuración JWT es inválida: falta el parámetro 'Jwt:Audience'.");
    }
}

// Determina un motivo legible para la respuesta 401 según el fallo de autenticación
// (cabecera ausente, malformada, firma inválida o token expirado) (Req 3.2-3.5).
static string DeterminarMotivo401(JwtBearerChallengeContext context)
{
    if (context.AuthenticateFailure is SecurityTokenExpiredException)
    {
        return "El token de autenticación ha expirado.";
    }

    if (context.AuthenticateFailure is SecurityTokenInvalidSignatureException)
    {
        return "La firma del token de autenticación no es válida.";
    }

    if (context.AuthenticateFailure is not null)
    {
        return "El token de autenticación no es válido.";
    }

    return "Se requiere autenticación para acceder a este recurso.";
}

// Make the Program class accessible for integration testing with WebApplicationFactory
public partial class Program { }
