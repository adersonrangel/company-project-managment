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

namespace CompanyProjectManagement.Tests.PropertyTests;

/// <summary>
/// Feature: company-project-management, Property 6: Unicidad de Identificación de Empresa
/// Para cualquier par de empresas en el sistema, si se intenta crear o actualizar una empresa
/// con una Identificación que ya existe en otra empresa, el sistema debe rechazar la operación
/// sin modificar datos existentes.
///
/// **Validates: Requirements 1.2, 3.4, 10.7**
/// </summary>
public class EmpresaUnicidadIdentificacionPropertyTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public EmpresaUnicidadIdentificacionPropertyTests()
    {
        _factory = new CustomWebApplicationFactory();
        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Property(MaxTest = 100)]
    public Property CrearEmpresa_ConIdentificacionDuplicada_Retorna409()
    {
        return Prop.ForAll(
            Arbitraries.ValidCrearEmpresaRequest(),
            Arbitraries.ValidCrearEmpresaRequest(),
            (request1, request2) =>
            {
                // Generate a unique identification shared by both requests
                var shortId = Guid.NewGuid().ToString("N")[..8];
                var baseId = request1.Identificacion.Length > 41
                    ? request1.Identificacion[..41]
                    : request1.Identificacion;
                var sharedIdentificacion = $"{baseId}_{shortId}";

                var firstRequest = request1 with { Identificacion = sharedIdentificacion };
                var secondRequest = request2 with { Identificacion = sharedIdentificacion };

                // Create the first empresa — should succeed
                var postResponse1 = _client.PostAsJsonAsync("/api/empresas", firstRequest).GetAwaiter().GetResult();
                postResponse1.StatusCode.Should().Be(HttpStatusCode.Created,
                    "first empresa creation should succeed");

                // Attempt to create a second empresa with the same Identificacion — should be rejected
                var postResponse2 = _client.PostAsJsonAsync("/api/empresas", secondRequest).GetAwaiter().GetResult();
                postResponse2.StatusCode.Should().Be(HttpStatusCode.Conflict,
                    "creating empresa with duplicate Identificacion should return 409 Conflict");
            });
    }

    [Property(MaxTest = 100)]
    public Property ActualizarEmpresa_ConIdentificacionDeOtraEmpresa_Retorna409()
    {
        return Prop.ForAll(
            Arbitraries.ValidCrearEmpresaRequest(),
            Arbitraries.ValidCrearEmpresaRequest(),
            (request1, request2) =>
            {
                // Generate unique identifications for both empresas
                var shortId1 = Guid.NewGuid().ToString("N")[..8];
                var shortId2 = Guid.NewGuid().ToString("N")[..8];

                var baseId1 = request1.Identificacion.Length > 41
                    ? request1.Identificacion[..41]
                    : request1.Identificacion;
                var baseId2 = request2.Identificacion.Length > 41
                    ? request2.Identificacion[..41]
                    : request2.Identificacion;

                var uniqueId1 = $"{baseId1}_{shortId1}";
                var uniqueId2 = $"{baseId2}_{shortId2}";

                var firstRequest = request1 with { Identificacion = uniqueId1 };
                var secondRequest = request2 with { Identificacion = uniqueId2 };

                // Create two empresas with different identifications
                var postResponse1 = _client.PostAsJsonAsync("/api/empresas", firstRequest).GetAwaiter().GetResult();
                postResponse1.StatusCode.Should().Be(HttpStatusCode.Created,
                    "first empresa creation should succeed");

                var postResponse2 = _client.PostAsJsonAsync("/api/empresas", secondRequest).GetAwaiter().GetResult();
                postResponse2.StatusCode.Should().Be(HttpStatusCode.Created,
                    "second empresa creation should succeed");

                var created2 = postResponse2.Content.ReadFromJsonAsync<EmpresaResponse>().GetAwaiter().GetResult();
                created2.Should().NotBeNull();

                // Attempt to update the second empresa's Identificacion to the first empresa's value
                var updateRequest = new ActualizarEmpresaRequest(
                    Nombre: secondRequest.Nombre,
                    Identificacion: uniqueId1, // duplicate — belongs to first empresa
                    Telefono: secondRequest.Telefono,
                    Direccion: secondRequest.Direccion,
                    EstadoHabilitacion: secondRequest.EstadoHabilitacion ?? true
                );

                var putResponse = _client.PutAsJsonAsync($"/api/empresas/{created2!.Id}", updateRequest).GetAwaiter().GetResult();
                putResponse.StatusCode.Should().Be(HttpStatusCode.Conflict,
                    "updating empresa Identificacion to a value already used by another empresa should return 409 Conflict");

                // Verify the second empresa was NOT modified
                var getResponse = _client.GetAsync($"/api/empresas/{created2.Id}").GetAwaiter().GetResult();
                getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

                var unchanged = getResponse.Content.ReadFromJsonAsync<EmpresaResponse>().GetAwaiter().GetResult();
                unchanged.Should().NotBeNull();
                unchanged!.Identificacion.Should().Be(uniqueId2,
                    "empresa Identificacion should remain unchanged after rejected update");
            });
    }
}
