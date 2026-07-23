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
/// Feature: company-project-management, Property 7: Unicidad de Nombre de Proyecto por Empresa
/// Para cualquier empresa con un proyecto existente, si se intenta crear otro proyecto con el mismo
/// nombre en esa misma empresa, el sistema debe rechazar la operación. Proyectos con el mismo nombre
/// en empresas diferentes deben ser permitidos.
///
/// **Validates: Requirements 5.4**
/// </summary>
public class ProyectoUnicidadNombrePropertyTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ProyectoUnicidadNombrePropertyTests()
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
    public Property CrearProyecto_ConNombreDuplicadoEnMismaEmpresa_Retorna409()
    {
        return Prop.ForAll(
            Arbitraries.ValidCrearProyectoRequest(),
            Arbitraries.ValidCrearProyectoRequest(),
            (proyecto1, proyecto2) =>
            {
                // Create a fresh empresa
                var empresaRequest = new CrearEmpresaRequest(
                    Nombre: $"Empresa-{Guid.NewGuid()}",
                    Identificacion: Guid.NewGuid().ToString("N")[..20],
                    Telefono: "+57 300 1234567",
                    Direccion: "Calle 100 #15-20, Bogotá",
                    EstadoHabilitacion: true
                );

                var empresaResponse = _client.PostAsJsonAsync("/api/empresas", empresaRequest).GetAwaiter().GetResult();
                empresaResponse.StatusCode.Should().Be(HttpStatusCode.Created,
                    "empresa creation should succeed");

                var empresa = empresaResponse.Content.ReadFromJsonAsync<EmpresaResponse>().GetAwaiter().GetResult();
                empresa.Should().NotBeNull();

                // Use a shared project name for both projects
                var sharedNombre = $"Proyecto-{Guid.NewGuid().ToString("N")[..8]}";
                var firstProyecto = proyecto1 with { Nombre = sharedNombre };
                var secondProyecto = proyecto2 with { Nombre = sharedNombre };

                // Create the first project — should succeed
                var postResponse1 = _client.PostAsJsonAsync(
                    $"/api/empresas/{empresa!.Id}/proyectos", firstProyecto).GetAwaiter().GetResult();
                postResponse1.StatusCode.Should().Be(HttpStatusCode.Created,
                    "first project creation should succeed");

                // Attempt to create a second project with the same name in the same empresa — should be rejected
                var postResponse2 = _client.PostAsJsonAsync(
                    $"/api/empresas/{empresa.Id}/proyectos", secondProyecto).GetAwaiter().GetResult();
                postResponse2.StatusCode.Should().Be(HttpStatusCode.Conflict,
                    "creating project with duplicate name in same empresa should return 409 Conflict");
            });
    }

    [Property(MaxTest = 100)]
    public Property CrearProyecto_ConMismoNombreEnEmpresasDiferentes_Permitido()
    {
        return Prop.ForAll(
            Arbitraries.ValidCrearProyectoRequest(),
            proyectoRequest =>
            {
                // Create two different empresas
                var empresa1Request = new CrearEmpresaRequest(
                    Nombre: $"Empresa1-{Guid.NewGuid()}",
                    Identificacion: Guid.NewGuid().ToString("N")[..20],
                    Telefono: "+57 300 1111111",
                    Direccion: "Calle 1 #1-1, Bogotá",
                    EstadoHabilitacion: true
                );

                var empresa2Request = new CrearEmpresaRequest(
                    Nombre: $"Empresa2-{Guid.NewGuid()}",
                    Identificacion: Guid.NewGuid().ToString("N")[..20],
                    Telefono: "+57 300 2222222",
                    Direccion: "Calle 2 #2-2, Medellín",
                    EstadoHabilitacion: true
                );

                var empresaResponse1 = _client.PostAsJsonAsync("/api/empresas", empresa1Request).GetAwaiter().GetResult();
                empresaResponse1.StatusCode.Should().Be(HttpStatusCode.Created,
                    "first empresa creation should succeed");
                var empresa1 = empresaResponse1.Content.ReadFromJsonAsync<EmpresaResponse>().GetAwaiter().GetResult();
                empresa1.Should().NotBeNull();

                var empresaResponse2 = _client.PostAsJsonAsync("/api/empresas", empresa2Request).GetAwaiter().GetResult();
                empresaResponse2.StatusCode.Should().Be(HttpStatusCode.Created,
                    "second empresa creation should succeed");
                var empresa2 = empresaResponse2.Content.ReadFromJsonAsync<EmpresaResponse>().GetAwaiter().GetResult();
                empresa2.Should().NotBeNull();

                // Use the same project name for both empresas
                var sharedNombre = $"Proyecto-{Guid.NewGuid().ToString("N")[..8]}";
                var proyectoForEmpresa1 = proyectoRequest with { Nombre = sharedNombre };
                var proyectoForEmpresa2 = proyectoRequest with { Nombre = sharedNombre };

                // Create project in first empresa — should succeed
                var postResponse1 = _client.PostAsJsonAsync(
                    $"/api/empresas/{empresa1!.Id}/proyectos", proyectoForEmpresa1).GetAwaiter().GetResult();
                postResponse1.StatusCode.Should().Be(HttpStatusCode.Created,
                    "project creation in first empresa should succeed");

                // Create project with same name in second empresa — should also succeed
                var postResponse2 = _client.PostAsJsonAsync(
                    $"/api/empresas/{empresa2!.Id}/proyectos", proyectoForEmpresa2).GetAwaiter().GetResult();
                postResponse2.StatusCode.Should().Be(HttpStatusCode.Created,
                    "project with same name in different empresa should succeed (201 Created)");

                // Verify both projects were created successfully
                var created1 = postResponse1.Content.ReadFromJsonAsync<ProyectoResponse>().GetAwaiter().GetResult();
                var created2 = postResponse2.Content.ReadFromJsonAsync<ProyectoResponse>().GetAwaiter().GetResult();

                created1.Should().NotBeNull();
                created2.Should().NotBeNull();
                created1!.Nombre.Should().Be(sharedNombre);
                created2!.Nombre.Should().Be(sharedNombre);
                created1.EmpresaId.Should().Be(empresa1.Id);
                created2.EmpresaId.Should().Be(empresa2.Id);
            });
    }
}
