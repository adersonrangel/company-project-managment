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
/// Feature: company-project-management, Property 11: Consistencia del listado de Empresas
/// Para cualquier secuencia de N empresas creadas exitosamente con identificaciones únicas,
/// la operación de listar empresas debe retornar al menos esas N empresas con todos sus campos correctos.
///
/// **Validates: Requirements 2.1**
/// </summary>
public class EmpresaListadoConsistenciaPropertyTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public EmpresaListadoConsistenciaPropertyTests()
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
    public Property Listado_RetornaTodasLasEmpresasCreadas_ConCamposCorrectos()
    {
        return Prop.ForAll(
            Arbitraries.ValidCrearEmpresaRequest(),
            Arbitraries.ValidCrearEmpresaRequest(),
            Arbitraries.ValidCrearEmpresaRequest(),
            (request1, request2, request3) =>
            {
                // Assign unique identifications to each request
                var suffix1 = Guid.NewGuid().ToString("N")[..8];
                var suffix2 = Guid.NewGuid().ToString("N")[..8];
                var suffix3 = Guid.NewGuid().ToString("N")[..8];

                var uniqueRequest1 = request1 with
                {
                    Identificacion = TruncateAndAppendSuffix(request1.Identificacion, suffix1)
                };
                var uniqueRequest2 = request2 with
                {
                    Identificacion = TruncateAndAppendSuffix(request2.Identificacion, suffix2)
                };
                var uniqueRequest3 = request3 with
                {
                    Identificacion = TruncateAndAppendSuffix(request3.Identificacion, suffix3)
                };

                // Create 3 empresas
                var postResponse1 = _client.PostAsJsonAsync("/api/empresas", uniqueRequest1).GetAwaiter().GetResult();
                postResponse1.StatusCode.Should().Be(HttpStatusCode.Created);
                var created1 = postResponse1.Content.ReadFromJsonAsync<EmpresaResponse>().GetAwaiter().GetResult();

                var postResponse2 = _client.PostAsJsonAsync("/api/empresas", uniqueRequest2).GetAwaiter().GetResult();
                postResponse2.StatusCode.Should().Be(HttpStatusCode.Created);
                var created2 = postResponse2.Content.ReadFromJsonAsync<EmpresaResponse>().GetAwaiter().GetResult();

                var postResponse3 = _client.PostAsJsonAsync("/api/empresas", uniqueRequest3).GetAwaiter().GetResult();
                postResponse3.StatusCode.Should().Be(HttpStatusCode.Created);
                var created3 = postResponse3.Content.ReadFromJsonAsync<EmpresaResponse>().GetAwaiter().GetResult();

                // GET list of all empresas
                var listResponse = _client.GetAsync("/api/empresas").GetAwaiter().GetResult();
                listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

                var empresas = listResponse.Content.ReadFromJsonAsync<List<EmpresaListResponse>>()
                    .GetAwaiter().GetResult();

                empresas.Should().NotBeNull();
                empresas!.Count.Should().BeGreaterThanOrEqualTo(3);

                // Verify each created empresa appears in the listing with correct fields
                VerifyEmpresaInList(empresas, created1!, uniqueRequest1);
                VerifyEmpresaInList(empresas, created2!, uniqueRequest2);
                VerifyEmpresaInList(empresas, created3!, uniqueRequest3);
            });
    }

    private static string TruncateAndAppendSuffix(string baseValue, string suffix)
    {
        // Max 50 chars for Identificacion: base (max 41) + "_" (1) + suffix (8) = 50
        var truncated = baseValue.Length > 41 ? baseValue[..41] : baseValue;
        return $"{truncated}_{suffix}";
    }

    private static void VerifyEmpresaInList(
        List<EmpresaListResponse> empresas,
        EmpresaResponse created,
        CrearEmpresaRequest originalRequest)
    {
        var found = empresas.FirstOrDefault(e => e.Id == created.Id);
        found.Should().NotBeNull($"Empresa with Id={created.Id} should be in the listing");
        found!.Nombre.Should().Be(originalRequest.Nombre);
        found.Identificacion.Should().Be(originalRequest.Identificacion);
        found.Telefono.Should().Be(originalRequest.Telefono);
        found.Direccion.Should().Be(originalRequest.Direccion);
        found.EstadoHabilitacion.Should().Be(originalRequest.EstadoHabilitacion ?? true);
    }
}
