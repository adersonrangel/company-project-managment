namespace CompanyProjectManagement.Application.DTOs.Requests;

public record CrearEmpresaRequest(
    string Nombre,
    string Identificacion,
    string Telefono,
    string Direccion,
    bool? EstadoHabilitacion
);
