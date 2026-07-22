using System.Net;
using System.Net.Http.Json;
using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.DTOs.Responses;
using CompanyProjectManagement.Tests.Infrastructure;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace CompanyProjectManagement.Tests.Properties;

/// <summary>
/// Property 5: Validación de FechaHabilitación de Proyecto
/// Para cualquier cadena que no sea una fecha válida en formato ISO 8601 (yyyy-MM-dd)
/// o que represente una fecha fuera del rango 2000-01-01 a 2099-12-31,
/// la validación debe rechazar el valor y retornar un mensaje de error apropiado.
///
/// **Validates: Requirements 11.2**
/// </summary>
public class FechaHabilitacionValidationPropertyTests
{
    [Property(MaxTest = 20)]
    public Property InvalidDateFormat_IsRejected()
    {
        var invalidFormatDates = Gen.OneOf(
            Gen.Constant("not-a-date"),
            Gen.Constant("12/25/2020"),
            Gen.Constant("2020/01/01"),
            Gen.Constant("01-01-2020"),
            Gen.Constant(""),
            Gen.Constant("2020-13-01"),
            Gen.Constant("2020-01-32"),
            Gen.Constant("abcd-ef-gh")
        ).ToArbitrary();

        return Prop.ForAll(invalidFormatDates, invalidDate =>
        {
            using var factory = new CustomWebApplicationFactory();
            using var client = factory.CreateClient();

            // Create empresa first
            var empresaRequest = new CrearEmpresaRequest(
                "Test Empresa", $"ID-{Guid.NewGuid():N}"[..50], "+1234", "Dir 123", true);
            var empresaResponse = client.PostAsJsonAsync("/api/empresas", empresaRequest).GetAwaiter().GetResult();
            var empresa = empresaResponse.Content.ReadFromJsonAsync<EmpresaResponse>().GetAwaiter().GetResult();

            // Try creating proyecto with invalid date
            var proyectoRequest = new CrearProyectoRequest("Proyecto Test", invalidDate, true);
            var response = client.PostAsJsonAsync($"/api/empresas/{empresa!.Id}/proyectos", proyectoRequest).GetAwaiter().GetResult();
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        });
    }

    [Property(MaxTest = 20)]
    public Property DateOutOfRange_IsRejected()
    {
        var outOfRangeDates = Gen.OneOf(
            // Before 2000
            Gen.Choose(1900, 1999).Select(y => $"{y}-06-15"),
            // After 2099
            Gen.Choose(2100, 2200).Select(y => $"{y}-06-15")
        ).ToArbitrary();

        return Prop.ForAll(outOfRangeDates, outOfRangeDate =>
        {
            using var factory = new CustomWebApplicationFactory();
            using var client = factory.CreateClient();

            // Create empresa first
            var empresaRequest = new CrearEmpresaRequest(
                "Test Empresa", $"ID-{Guid.NewGuid():N}"[..50], "+1234", "Dir 123", true);
            var empresaResponse = client.PostAsJsonAsync("/api/empresas", empresaRequest).GetAwaiter().GetResult();
            var empresa = empresaResponse.Content.ReadFromJsonAsync<EmpresaResponse>().GetAwaiter().GetResult();

            // Try creating proyecto with out-of-range date
            var proyectoRequest = new CrearProyectoRequest("Proyecto Test", outOfRangeDate, true);
            var response = client.PostAsJsonAsync($"/api/empresas/{empresa!.Id}/proyectos", proyectoRequest).GetAwaiter().GetResult();
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        });
    }
}
