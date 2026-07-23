namespace CompanyProjectManagement.Api.Middleware;

using System.Text.Json;
using CompanyProjectManagement.Application.DTOs.Responses;
using CompanyProjectManagement.Domain.Exceptions;
using FluentValidation;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, response) = exception switch
        {
            ValidationException validationEx => HandleValidationException(validationEx),
            EntityNotFoundException notFoundEx => (StatusCodes.Status404NotFound,
                new ErrorResponse(notFoundEx.Message)),
            DuplicateIdentificationException duplicateEx => (StatusCodes.Status409Conflict,
                new ErrorResponse(duplicateEx.Message)),
            ReferentialIntegrityException referentialEx => (StatusCodes.Status409Conflict,
                new ErrorResponse(referentialEx.Message)),
            _ => HandleUnknownException(exception)
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsJsonAsync(response, jsonOptions);
    }

    private (int, ErrorResponse) HandleValidationException(ValidationException ex)
    {
        var errores = ex.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => ToCamelCase(g.Key),
                g => g.Select(e => e.ErrorMessage).ToArray()
            );

        return (StatusCodes.Status400BadRequest,
            new ErrorResponse("La validación falló para uno o más campos.", errores));
    }

    private (int, ErrorResponse) HandleUnknownException(Exception ex)
    {
        _logger.LogError(ex, "An unhandled exception occurred.");
        return (StatusCodes.Status500InternalServerError,
            new ErrorResponse("Ha ocurrido un error interno en el servidor."));
    }

    private static string ToCamelCase(string str)
    {
        if (string.IsNullOrEmpty(str)) return str;
        return char.ToLowerInvariant(str[0]) + str[1..];
    }
}
