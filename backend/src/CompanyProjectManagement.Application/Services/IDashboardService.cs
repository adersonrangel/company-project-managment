namespace CompanyProjectManagement.Application.Services;

using CompanyProjectManagement.Application.DTOs.Responses;

public interface IDashboardService
{
    Task<DashboardEstadisticasResponse> ObtenerEstadisticasAsync();
}
