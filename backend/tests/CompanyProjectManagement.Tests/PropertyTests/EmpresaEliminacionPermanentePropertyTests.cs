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
/// Feature: company-project-management, Property 9: Eliminación permanente de Empresa
/// Para cualquier empresa existente sin proyectos asociados, después de eliminarla,
/// el sistema no debe retornarla en listados ni en consultas directas.
///
/// **Validates: Requirements 4.1, 4.2**
/// </summary>
public class EmpresaEliminacionPermanentePropertyTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public EmpresaEliminacionPermanentePropertyTests()
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
    public Property EmpresaSinProyectos_AlEliminar_NoApareceEnConsultasNiListados()
    {
        return Prop.ForAll(Arbitraries.ValidCrearEmpresaRequest(), request =>
        {
            // Ensure unique Identificacion
            var shortId = Guid.NewGuid().ToString("N")[..8];
            var baseId = request.Identificacion.Length > 41
                ? request.Identificacion[..41]
                : request.Identificacion;
            var uniqueId = $"{baseId}_{shortId}";

            var uniqueRequest = request with { Identificacion = uniqueId };

            // 1. Create empresa
            var postResponse = _client.PostAsJsonAsync("/api/empresas", uniqueRequest).GetAwaiter().GetResult();
            postResponse.StatusCode.Should().Be(HttpStatusCode.Created);

            var created = postResponse.Content.ReadFromJsonAsync<EmpresaResponse>().GetAwaiter().GetResult();
            created.Should().NotBeNull();
            var empresaId = created!.Id;

            // 2. Delete empresa (no projects associated) — expects 204 No Content
            var deleteResponse = _client.DeleteAsync($"/api/empresas/{empresaId}").GetAwaiter().GetResult();
            deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent,
                "DELETE should return 204 for empresa without projects (Req 4.1)");

            // 3. Verify empresa is NOT retrievable by direct query — expects 404
            var getResponse = _client.GetAsync($"/api/empresas/{empresaId}").GetAwaiter().GetResult();
            getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound,
                "GET by ID should return 404 after deletion (Req 4.2)");

            // 4. Verify empresa does NOT appear in listing
            var listResponse = _client.GetAsync("/api/empresas").GetAwaiter().GetResult();
            listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var empresas = listResponse.Content.ReadFromJsonAsync<List<EmpresaListResponse>>().GetAwaiter().GetResult();
            empresas.Should().NotBeNull();
            empresas!.Should().NotContain(e => e.Id == empresaId,
                "deleted empresa should not appear in listing (Req 4.2)");
        });
    }
}
