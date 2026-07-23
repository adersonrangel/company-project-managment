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
/// Feature: company-project-management, Property 10: Eliminación permanente de Proyecto
/// Para cualquier proyecto existente, después de eliminarlo, el sistema no debe retornarlo
/// en listados ni en consultas directas dentro de su empresa.
///
/// **Validates: Requirements 8.1**
/// </summary>
public class ProyectoEliminacionPermanentePropertyTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ProyectoEliminacionPermanentePropertyTests()
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
    public Property Proyecto_AlEliminar_NoApareceEnConsultasNiListados()
    {
        return Prop.ForAll(
            Arbitraries.ValidCrearEmpresaRequest(),
            Arbitraries.ValidCrearProyectoRequest(),
            (empresaRequest, proyectoRequest) =>
        {
            // Ensure unique Identificacion for the empresa
            var shortId = Guid.NewGuid().ToString("N")[..8];
            var baseId = empresaRequest.Identificacion.Length > 41
                ? empresaRequest.Identificacion[..41]
                : empresaRequest.Identificacion;
            var uniqueId = $"{baseId}_{shortId}";

            var uniqueEmpresaRequest = empresaRequest with { Identificacion = uniqueId };

            // Ensure unique project name
            var uniqueProyectoName = $"{proyectoRequest.Nombre[..Math.Min(proyectoRequest.Nombre.Length, 180)]}_{shortId}";
            var uniqueProyectoRequest = proyectoRequest with { Nombre = uniqueProyectoName };

            // 1. Create empresa
            var postEmpresaResponse = _client.PostAsJsonAsync("/api/empresas", uniqueEmpresaRequest).GetAwaiter().GetResult();
            postEmpresaResponse.StatusCode.Should().Be(HttpStatusCode.Created);

            var createdEmpresa = postEmpresaResponse.Content.ReadFromJsonAsync<EmpresaResponse>().GetAwaiter().GetResult();
            createdEmpresa.Should().NotBeNull();
            var empresaId = createdEmpresa!.Id;

            // 2. Create proyecto associated to the empresa
            var postProyectoResponse = _client.PostAsJsonAsync($"/api/empresas/{empresaId}/proyectos", uniqueProyectoRequest).GetAwaiter().GetResult();
            postProyectoResponse.StatusCode.Should().Be(HttpStatusCode.Created);

            var createdProyecto = postProyectoResponse.Content.ReadFromJsonAsync<ProyectoResponse>().GetAwaiter().GetResult();
            createdProyecto.Should().NotBeNull();
            var proyectoId = createdProyecto!.Id;

            // 3. Delete proyecto — expects 204 No Content
            var deleteResponse = _client.DeleteAsync($"/api/empresas/{empresaId}/proyectos/{proyectoId}").GetAwaiter().GetResult();
            deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent,
                "DELETE should return 204 for existing proyecto (Req 8.1)");

            // 4. Verify proyecto is NOT retrievable by direct query — expects 404
            var getResponse = _client.GetAsync($"/api/empresas/{empresaId}/proyectos/{proyectoId}").GetAwaiter().GetResult();
            getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound,
                "GET by ID should return 404 after deletion (Req 8.1)");

            // 5. Verify proyecto does NOT appear in the empresa's project listing
            var listResponse = _client.GetAsync($"/api/empresas/{empresaId}/proyectos").GetAwaiter().GetResult();
            listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var proyectos = listResponse.Content.ReadFromJsonAsync<List<ProyectoListResponse>>().GetAwaiter().GetResult();
            proyectos.Should().NotBeNull();
            proyectos!.Should().NotContain(p => p.Id == proyectoId,
                "deleted proyecto should not appear in empresa's project listing (Req 8.1)");
        });
    }
}
