namespace CompanyProjectManagement.Application.DTOs.Responses;

public record EmpresaResponse(
    int Id,
    string Nombre,
    string Identificacion,
    string Telefono,
    string Direccion,
    bool EstadoHabilitacion
);
