using System.Net;
using System.Net.Http.Json;
using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Tests.Generators;
using CompanyProjectManagement.Tests.Infrastructure;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace CompanyProjectManagement.Tests.PropertyTests;

/// <summary>
/// Property 4: Validación de patrón de Teléfono
/// Para cualquier cadena que contenga al menos un carácter fuera del conjunto permitido
/// (dígitos 0-9, +, espacios, guiones), la validación del campo Teléfono debe rechazar
/// el valor y retornar un mensaje de error indicando los caracteres permitidos.
///
/// **Validates: Requirements 10.3**
/// </summary>
public class TelefonoValidationPropertyTests
{
    [Property(MaxTest = 30)]
    public Property InvalidPhonePattern_IsRejected()
    {
        return Prop.ForAll(
            Arbitraries.InvalidPhone().ToArbitrary(),
            invalidPhone =>
            {
                using var factory = new CustomWebApplicationFactory();
                using var client = factory.CreateClient();

                var request = new CrearEmpresaRequest(
                    "Empresa Válida",
                    $"ID-{Guid.NewGuid():N}"[..50],
                    invalidPhone,
                    "Dirección Válida 123",
                    true);

                var response = client.PostAsJsonAsync("/api/empresas", request).GetAwaiter().GetResult();
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            });
    }
}
