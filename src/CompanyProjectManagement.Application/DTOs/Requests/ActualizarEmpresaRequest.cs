namespace CompanyProjectManagement.Application.DTOs.Requests;

public record ActualizarEmpresaRequest(
    string Nombre,
    string Identificacion,
    string Telefono,
    string Direccion,
    bool EstadoHabilitacion
);
