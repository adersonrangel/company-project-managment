namespace CompanyProjectManagement.Application.DTOs.Requests;

public record ActualizarProyectoRequest(
    string? Nombre,
    string? FechaHabilitacion,
    bool? EstadoHabilitacion
);
