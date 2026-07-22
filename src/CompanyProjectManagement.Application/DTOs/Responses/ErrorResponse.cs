namespace CompanyProjectManagement.Application.DTOs.Responses;

public record ErrorResponse(
    string Mensaje,
    IDictionary<string, string[]>? Errores = null
);
