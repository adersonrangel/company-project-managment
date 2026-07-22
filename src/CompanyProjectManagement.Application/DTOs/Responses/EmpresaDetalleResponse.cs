namespace CompanyProjectManagement.Application.DTOs.Responses;

public record EmpresaDetalleResponse(
    int Id,
    string Nombre,
    string Identificacion,
    string Telefono,
    string Direccion,
    bool EstadoHabilitacion,
    IEnumerable<ProyectoListResponse> Proyectos
);
