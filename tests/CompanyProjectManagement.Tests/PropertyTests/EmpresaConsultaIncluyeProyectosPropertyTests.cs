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
/// Feature: company-project-management, Property 12: Consulta de Empresa incluye todos sus Proyectos
/// Para cualquier empresa con N proyectos asociados, al consultar la empresa por su ID,
/// la respuesta debe incluir exactamente esos N proyectos con sus IDs y nombres correctos.
///
/// **Validates: Requirements 2.3, 6.1, 9.3**
/// </summary>
public class EmpresaConsultaIncluyeProyectosPropertyTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public EmpresaConsultaIncluyeProyectosPropertyTests()
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
    public Property ConsultaEmpresa_IncluyeExactamenteTodosSusProyectos()
    {
        return Prop.ForAll(
            Gen.Choose(1, 5).ToArbitrary(),
            projectCount =>
            {
                ConsultaEmpresaConProyectosAsync(projectCount).GetAwaiter().GetResult();
            });
    }

    private async Task ConsultaEmpresaConProyectosAsync(int projectCount)
    {
        // 1. Create a fresh empresa with unique Identificacion
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

        // 2. Create N projects with unique names associated to the empresa
        var createdProjects = new List<ProyectoResponse>();

        for (int i = 0; i < projectCount; i++)
        {
            var proyectoRequest = new CrearProyectoRequest(
                Nombre: $"Proyecto-{i}-{Guid.NewGuid()}",
                FechaHabilitacion: $"2024-{(i % 12) + 1:D2}-{(i % 28) + 1:D2}",
                EstadoHabilitacion: i % 2 == 0
            );

            var createResponse = await _client.PostAsJsonAsync(
                $"/api/empresas/{empresa!.Id}/proyectos", proyectoRequest);
            createResponse.StatusCode.Should().Be(HttpStatusCode.Created,
                $"Failed to create project {i + 1} of {projectCount}");

            var createdProject = await createResponse.Content.ReadFromJsonAsync<ProyectoResponse>();
            createdProject.Should().NotBeNull();
            createdProjects.Add(createdProject!);
        }

        // 3. GET the empresa detail which should include all projects
        var getResponse = await _client.GetAsync($"/api/empresas/{empresa!.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var detalle = await getResponse.Content.ReadFromJsonAsync<EmpresaDetalleResponse>();
        detalle.Should().NotBeNull();

        // 4. Verify the response includes exactly N projects
        var proyectos = detalle!.Proyectos.ToList();
        proyectos.Should().HaveCount(projectCount,
            $"Expected exactly {projectCount} projects for empresa {empresa.Id}");

        // 5. Verify each created project appears in the empresa detail with correct ID and name
        foreach (var created in createdProjects)
        {
            var found = proyectos.FirstOrDefault(p => p.Id == created.Id);
            found.Should().NotBeNull(
                $"Project with Id={created.Id} and Nombre='{created.Nombre}' should be included in empresa detail");
            found!.Nombre.Should().Be(created.Nombre);
            found.FechaHabilitacion.Should().Be(created.FechaHabilitacion);
            found.EstadoHabilitacion.Should().Be(created.EstadoHabilitacion);
        }
    }
}
