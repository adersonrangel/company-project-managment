namespace CompanyProjectManagement.Application.DTOs.Responses;

public record ProyectoResponse(
    int Id,
    string Nombre,
    string FechaHabilitacion,
    bool EstadoHabilitacion,
    int EmpresaId
);
