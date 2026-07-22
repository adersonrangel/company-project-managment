using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.DTOs.Responses;
using CompanyProjectManagement.Tests.Generators;
using CompanyProjectManagement.Tests.Infrastructure;

namespace CompanyProjectManagement.Tests.Properties;

/// <summary>
/// Property 1: Round-trip de creación de Empresa
/// Para cualquier combinación válida de datos de empresa, al crear la empresa y luego consultarla,
/// todos los campos retornados deben coincidir exactamente con los datos enviados.
/// 
/// **Validates: Requirements 1.1, 2.3, 3.1**
/// </summary>
public class EmpresaRoundTripPropertyTests
{
    [Property(MaxTest = 5)]
    public Property RoundTrip_CrearEmpresa_AllFieldsMatch()
    {
        return Prop.ForAll(Arbitraries.ValidCrearEmpresaRequest(), request =>
        {
            // Make Identificacion unique to avoid conflicts between test iterations
            var combinedId = $"{request.Identificacion}_{Guid.NewGuid():N}";
            var uniqueRequest = request with
            {
                Identificacion = combinedId.Length > 50 ? combinedId[..50] : combinedId
            };

            using var factory = new CustomWebApplicationFactory();
            using var client = factory.CreateClient();

            // POST - Create empresa
            var postResponse = client.PostAsJsonAsync("/api/empresas", uniqueRequest).GetAwaiter().GetResult();
            if (postResponse.StatusCode != HttpStatusCode.Created)
            {
                var errorBody = postResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult();
                postResponse.StatusCode.Should().Be(HttpStatusCode.Created,
                    $"Response body: {errorBody}. Request: Nombre.Length={uniqueRequest.Nombre.Length}, " +
                    $"Id.Length={uniqueRequest.Identificacion.Length}, Tel.Length={uniqueRequest.Telefono.Length}, " +
                    $"Dir.Length={uniqueRequest.Direccion.Length}");
            }

            var created = postResponse.Content.ReadFromJsonAsync<EmpresaResponse>().GetAwaiter().GetResult();
            created.Should().NotBeNull();
            created!.Id.Should().BeGreaterThan(0);
            created.Nombre.Should().Be(uniqueRequest.Nombre);
            created.Identificacion.Should().Be(uniqueRequest.Identificacion);
            created.Telefono.Should().Be(uniqueRequest.Telefono);
            created.Direccion.Should().Be(uniqueRequest.Direccion);
            created.EstadoHabilitacion.Should().Be(uniqueRequest.EstadoHabilitacion ?? true);

            // GET by ID - Retrieve empresa
            var getResponse = client.GetAsync($"/api/empresas/{created.Id}").GetAwaiter().GetResult();
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var detail = getResponse.Content.ReadFromJsonAsync<EmpresaDetalleResponse>().GetAwaiter().GetResult();
            detail.Should().NotBeNull();
            detail!.Id.Should().Be(created.Id);
            detail.Nombre.Should().Be(uniqueRequest.Nombre);
            detail.Identificacion.Should().Be(uniqueRequest.Identificacion);
            detail.Telefono.Should().Be(uniqueRequest.Telefono);
            detail.Direccion.Should().Be(uniqueRequest.Direccion);
            detail.EstadoHabilitacion.Should().Be(uniqueRequest.EstadoHabilitacion ?? true);
            detail.Proyectos.Should().BeEmpty();
        });
    }
}
