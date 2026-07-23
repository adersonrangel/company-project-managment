namespace CompanyProjectManagement.Application.Services;

using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.DTOs.Responses;

public interface IProyectoService
{
    Task<ProyectoResponse> CrearAsync(int empresaId, CrearProyectoRequest request);
    Task<IEnumerable<ProyectoListResponse>> ListarPorEmpresaAsync(int empresaId);
    Task<ProyectoDetalleResponse> ObtenerPorIdAsync(int empresaId, int proyectoId);
    Task<ProyectoResponse> ActualizarAsync(int empresaId, int proyectoId, ActualizarProyectoRequest request);
    Task EliminarAsync(int empresaId, int proyectoId);
}
