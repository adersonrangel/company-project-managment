using System.Net;
using System.Net.Http.Json;
using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Tests.Generators;
using CompanyProjectManagement.Tests.Infrastructure;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace CompanyProjectManagement.Tests.Properties;

/// <summary>
/// Property 3: Validación de campos de Empresa rechaza datos inválidos
/// 
/// Para cualquier solicitud de creación de empresa donde al menos un campo viole las reglas
/// de validación, el sistema debe rechazar la operación sin crear registros y retornar 400 Bad Request.
/// 
/// **Validates: Requirements 1.3, 1.4, 3.3, 10.1, 10.2, 10.4, 10.6**
/// </summary>
public class EmpresaValidationPropertyTests
{
    /// <summary>
    /// Un Nombre inválido (vacío, solo espacios, o excede 200 caracteres) debe ser rechazado con 400.
    /// **Validates: Requirements 1.3, 1.4, 10.1, 10.6**
    /// </summary>
    [Property(MaxTest = 20)]
    public Property InvalidNombre_IsRejected()
    {
        return Prop.ForAll(
            Arbitraries.InvalidString(200).ToArbitrary(),
            invalidNombre =>
            {
                using var factory = new CustomWebApplicationFactory();
                using var client = factory.CreateClient();

                var request = new CrearEmpresaRequest(
                    invalidNombre, "VALID-ID-123", "+1234567", "Valid Address 123", true);

                var response = client.PostAsJsonAsync("/api/empresas", request).GetAwaiter().GetResult();
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            });
    }

    /// <summary>
    /// Una Identificacion inválida (vacía, solo espacios, o excede 50 caracteres) debe ser rechazada con 400.
    /// **Validates: Requirements 1.3, 1.4, 10.2, 10.6**
    /// </summary>
    [Property(MaxTest = 20)]
    public Property InvalidIdentificacion_IsRejected()
    {
        return Prop.ForAll(
            Arbitraries.InvalidString(50).ToArbitrary(),
            invalidIdentificacion =>
            {
                using var factory = new CustomWebApplicationFactory();
                using var client = factory.CreateClient();

                var request = new CrearEmpresaRequest(
                    "Empresa Válida", invalidIdentificacion, "+1234567", "Valid Address 123", true);

                var response = client.PostAsJsonAsync("/api/empresas", request).GetAwaiter().GetResult();
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            });
    }

    /// <summary>
    /// Una Direccion inválida (vacía, solo espacios, o excede 300 caracteres) debe ser rechazada con 400.
    /// **Validates: Requirements 1.3, 1.4, 10.4, 10.6**
    /// </summary>
    [Property(MaxTest = 20)]
    public Property InvalidDireccion_IsRejected()
    {
        return Prop.ForAll(
            Arbitraries.InvalidString(300).ToArbitrary(),
            invalidDireccion =>
            {
                using var factory = new CustomWebApplicationFactory();
                using var client = factory.CreateClient();

                var request = new CrearEmpresaRequest(
                    "Empresa Válida", "VALID-ID-456", "+1234567", invalidDireccion, true);

                var response = client.PostAsJsonAsync("/api/empresas", request).GetAwaiter().GetResult();
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            });
    }
}
