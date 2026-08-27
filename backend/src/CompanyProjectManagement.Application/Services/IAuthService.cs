namespace CompanyProjectManagement.Application.Services;

using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.DTOs.Responses;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request); // Req 1
}
