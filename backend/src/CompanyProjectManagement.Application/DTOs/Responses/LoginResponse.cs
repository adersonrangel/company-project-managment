namespace CompanyProjectManagement.Application.DTOs.Responses;

public record LoginResponse(
    string Token,
    int ExpiresIn
);
