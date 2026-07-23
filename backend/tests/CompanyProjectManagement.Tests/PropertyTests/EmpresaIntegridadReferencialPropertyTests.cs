using System.Net;
using System.Net.Http.Json;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using FluentAssertions;
using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.DTOs.Responses;
using CompanyProjectManagement.Tests.Generators;
using CompanyProjectManagement.Tests.Infrastructure;

namespace CompanyProjectManagement.Tests.PropertyTests;

/// <summary>
/// Property 8: Integridad referencial — Empresa con Proyectos no eliminable
/// Para cualquier empresa que tenga uno o más proyectos asociados, al solicitar su eliminación,
/// el sistema debe rechazar la operación, preservar el registro de la empresa y todos sus
/// proyectos sin modificaciones.
///
/// **Validates: Requirements 4.3, 9.5**
/// </summary>
public class EmpresaIntegridadReferencialPropertyTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public EmpresaIntegridadReferencialPropertyTests()
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
    public Property EmpresaConProyectos_NoSePuedeEliminar_YPreservaRegistros()
    {
        return Prop.ForAll(
            Arbitraries.ValidCrearEmpresaRequest(),
            Arbitraries.ValidCrearProyectoRequest(),
            (empresaRequest, proyectoRequest) =>
            {
                VerificarIntegridadReferencialAsync(empresaRequest, proyectoRequest)
                    .GetAwaiter().GetResult();
            });
    }

    private async Task VerificarIntegridadReferencialAsync(
        CrearEmpresaRequest empresaRequest,
        CrearProyectoRequest proyectoRequest)
    {
        // 1. Create empresa with unique Identificacion
        var shortId = Guid.NewGuid().ToString("N")[..8];
        var baseId = empresaRequest.Identificacion.Length > 41
            ? empresaRequest.Identificacion[..41]
            : empresaRequest.Identificacion;
        var uniqueEmpresaRequest = empresaRequest with { Identificacion = $"{baseId}_{shortId}" };

        var createEmpresaResponse = await _client.PostAsJsonAsync("/api/empresas", uniqueEmpresaRequest);
        createEmpresaResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var empresa = await createEmpresaResponse.Content.ReadFromJsonAsync<EmpresaResponse>();
        empresa.Should().NotBeNull();

        // 2. Create proyecto with unique name under the empresa
        var uniqueProyectoRequest = proyectoRequest with
        {
            Nombre = $"{proyectoRequest.Nombre}-{Guid.NewGuid()}"
        };
        if (uniqueProyectoRequest.Nombre.Length > 200)
        {
            uniqueProyectoRequest = uniqueProyectoRequest with
            {
                Nombre = uniqueProyectoRequest.Nombre[..200]
            };
        }

        var createProyectoResponse = await _client.PostAsJsonAsync(
            $"/api/empresas/{empresa!.Id}/proyectos", uniqueProyectoRequest);
        createProyectoResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var proyecto = await createProyectoResponse.Content.ReadFromJsonAsync<ProyectoResponse>();
        proyecto.Should().NotBeNull();

        // 3. Attempt to delete the empresa — should be rejected with 409
        var deleteResponse = await _client.DeleteAsync($"/api/empresas/{empresa.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.Conflict,
            "Deleting an empresa with associated projects must be rejected (409 Conflict)");

        // 4. Verify empresa still exists with all original data preserved
        var getEmpresaResponse = await _client.GetAsync($"/api/empresas/{empresa.Id}");
        getEmpresaResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var empresaDetalle = await getEmpresaResponse.Content.ReadFromJsonAsync<EmpresaDetalleResponse>();
        empresaDetalle.Should().NotBeNull();
        empresaDetalle!.Id.Should().Be(empresa.Id);
        empresaDetalle.Nombre.Should().Be(uniqueEmpresaRequest.Nombre);
        empresaDetalle.Identificacion.Should().Be(uniqueEmpresaRequest.Identificacion);
        empresaDetalle.Telefono.Should().Be(uniqueEmpresaRequest.Telefono);
        empresaDetalle.Direccion.Should().Be(uniqueEmpresaRequest.Direccion);

        // 5. Verify the proyecto is still associated and unmodified
        empresaDetalle.Proyectos.Should().NotBeEmpty();
        empresaDetalle.Proyectos.Should().Contain(p =>
            p.Id == proyecto!.Id &&
            p.Nombre == uniqueProyectoRequest.Nombre &&
            p.FechaHabilitacion == uniqueProyectoRequest.FechaHabilitacion);
    }
}
