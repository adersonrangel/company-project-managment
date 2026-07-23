namespace CompanyProjectManagement.Application.DTOs.Responses;

public record ProyectoListResponse(
    int Id,
    string Nombre,
    string FechaHabilitacion,
    bool EstadoHabilitacion
);
