namespace CompanyProjectManagement.Application.Services;

using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.DTOs.Responses;

public interface IEmpresaService
{
    Task<EmpresaResponse> CrearAsync(CrearEmpresaRequest request);
    Task<IEnumerable<EmpresaListResponse>> ListarAsync();
    Task<EmpresaDetalleResponse> ObtenerPorIdAsync(int id);
    Task<EmpresaResponse> ActualizarAsync(int id, ActualizarEmpresaRequest request);
    Task EliminarAsync(int id);
}
