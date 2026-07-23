namespace CompanyProjectManagement.Application.DTOs.Requests;

public record CrearProyectoRequest(
    string Nombre,
    string FechaHabilitacion,
    bool? EstadoHabilitacion
);
