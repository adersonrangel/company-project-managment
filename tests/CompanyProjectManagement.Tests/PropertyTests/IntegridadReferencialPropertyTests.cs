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
/// Feature: company-project-management, Property 8: Integridad referencial — Empresa con Proyectos no eliminable
/// Para cualquier empresa que tenga uno o más proyectos asociados, al solicitar su eliminación,
/// el sistema debe rechazar la operación, preservar el registro de la empresa y todos sus proyectos
/// sin modificaciones.
///
/// **Validates: Requirements 4.3, 9.5**
/// </summary>
public class IntegridadReferencialPropertyTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public IntegridadReferencialPropertyTests()
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
    public Property EliminarEmpresa_ConProyectos_Retorna409YPreservaRegistros()
    {
        return Prop.ForAll(Arbitraries.ValidCrearProyectoRequest(), proyectoRequest =>
        {
            EliminarEmpresaConProyectosEsRechazadoAsync(proyectoRequest).GetAwaiter().GetResult();
        });
    }

    private async Task EliminarEmpresaConProyectosEsRechazadoAsync(CrearProyectoRequest proyectoRequest)
    {
        // 1. Create a fresh empresa
        var empresaRequest = new CrearEmpresaRequest(
            Nombre: $"Empresa-{Guid.NewGuid()}",
            Identificacion: Guid.NewGuid().ToString("N"),
            Telefono: "+57 300 1234567",
            Direccion: "Calle 100 #15-20, Bogotá",
            EstadoHabilitacion: true
        );

        var empresaResponse = await _client.PostAsJsonAsync("/api/empresas", empresaRequest);
        empresaResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var empresa = await empresaResponse.Content.ReadFromJsonAsync<EmpresaResponse>();
        empresa.Should().NotBeNull();

        // 2. Create a proyecto associated with the empresa
        var rawName = $"{proyectoRequest.Nombre}-{Guid.NewGuid():N}";
        var uniqueProyectoName = rawName[..Math.Min(rawName.Length, 200)];
        var request = proyectoRequest with { Nombre = uniqueProyectoName };

        var proyectoResponse = await _client.PostAsJsonAsync(
            $"/api/empresas/{empresa!.Id}/proyectos", request);
        proyectoResponse.StatusCode.Should().Be(HttpStatusCode.Created,
            "proyecto creation should succeed before testing deletion rejection");
        var proyecto = await proyectoResponse.Content.ReadFromJsonAsync<ProyectoResponse>();
        proyecto.Should().NotBeNull();

        // 3. Attempt to delete the empresa — should be rejected with 409 Conflict
        var deleteResponse = await _client.DeleteAsync($"/api/empresas/{empresa.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.Conflict,
            "deleting empresa with associated proyectos should return 409 Conflict");

        // 4. Verify empresa is still retrievable (preserved)
        var getEmpresaResponse = await _client.GetAsync($"/api/empresas/{empresa.Id}");
        getEmpresaResponse.StatusCode.Should().Be(HttpStatusCode.OK,
            "empresa should still exist after failed deletion attempt");

        var empresaDetail = await getEmpresaResponse.Content.ReadFromJsonAsync<EmpresaDetalleResponse>();
        empresaDetail.Should().NotBeNull();
        empresaDetail!.Id.Should().Be(empresa.Id);
        empresaDetail.Nombre.Should().Be(empresaRequest.Nombre);
        empresaDetail.Identificacion.Should().Be(empresaRequest.Identificacion);

        // 5. Verify proyecto is still retrievable (preserved)
        var getProyectoResponse = await _client.GetAsync(
            $"/api/empresas/{empresa.Id}/proyectos/{proyecto!.Id}");
        getProyectoResponse.StatusCode.Should().Be(HttpStatusCode.OK,
            "proyecto should still exist after failed empresa deletion attempt");

        var proyectoDetail = await getProyectoResponse.Content.ReadFromJsonAsync<ProyectoDetalleResponse>();
        proyectoDetail.Should().NotBeNull();
        proyectoDetail!.Id.Should().Be(proyecto.Id);
        proyectoDetail.Nombre.Should().Be(uniqueProyectoName);
        proyectoDetail.EmpresaId.Should().Be(empresa.Id);
    }
}
