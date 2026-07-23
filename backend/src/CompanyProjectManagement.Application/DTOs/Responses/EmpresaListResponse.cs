namespace CompanyProjectManagement.Application.DTOs.Responses;

public record EmpresaListResponse(
    int Id,
    string Nombre,
    string Identificacion,
    string Telefono,
    string Direccion,
    bool EstadoHabilitacion
);
