namespace CompanyProjectManagement.Application.DTOs.Responses;

public record ProyectoDetalleResponse(
    int Id,
    string Nombre,
    string FechaHabilitacion,
    bool EstadoHabilitacion,
    int EmpresaId,
    string EmpresaNombre
);
