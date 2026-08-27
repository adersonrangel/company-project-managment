namespace CompanyProjectManagement.Application.DTOs.Requests;

public record LoginRequest(
    string Username,
    string Password
);
