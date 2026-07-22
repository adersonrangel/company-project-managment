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

namespace CompanyProjectManagement.Tests.Properties;

/// <summary>
/// Property 2: Round-trip de creación de Proyecto
/// Para cualquier combinación válida de datos de proyecto y una empresa existente,
/// al crear el proyecto y luego consultarlo, todos los campos retornados deben coincidir
/// exactamente con los datos enviados y el proyecto debe estar asociado a la empresa correcta.
///
/// **Validates: Requirements 5.1, 6.2**
/// </summary>
public class ProyectoRoundTripPropertyTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ProyectoRoundTripPropertyTests()
    {
        _factory = new CustomWebApplicationFactory();
        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Property(MaxTest = 20)]
    public Property RoundTrip_CrearYConsultarProyecto_CamposCoinciden()
    {
        return Prop.ForAll(
            Arbitraries.ValidCrearProyectoRequest(),
            proyectoRequest => RoundTripProyectoAsync(proyectoRequest).GetAwaiter().GetResult()
        );
    }

    private async Task<bool> RoundTripProyectoAsync(CrearProyectoRequest originalRequest)
    {
        // 1. Create a fresh empresa with unique Identificacion
        var empresaRequest = new CrearEmpresaRequest(
            Nombre: $"Empresa-{Guid.NewGuid()}",
            Identificacion: Guid.NewGuid().ToString()[..50],
            Telefono: "+57 300 1234567",
            Direccion: "Calle 100 #15-20, Bogotá",
            EstadoHabilitacion: true
        );

        var empresaResponse = await _client.PostAsJsonAsync("/api/empresas", empresaRequest);
        empresaResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var empresa = await empresaResponse.Content.ReadFromJsonAsync<EmpresaResponse>();
        empresa.Should().NotBeNull();

        // 2. Make project name unique to avoid duplicate conflicts
        var uniqueRequest = originalRequest with
        {
            Nombre = $"{originalRequest.Nombre}-{Guid.NewGuid()}"
        };

        // Truncate name if it exceeds 200 characters after appending GUID
        if (uniqueRequest.Nombre.Length > 200)
        {
            uniqueRequest = uniqueRequest with
            {
                Nombre = uniqueRequest.Nombre[..200]
            };
        }

        // 3. POST the proyecto to the empresa
        var createResponse = await _client.PostAsJsonAsync(
            $"/api/empresas/{empresa!.Id}/proyectos", uniqueRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created,
            $"Expected 201 Created but got {createResponse.StatusCode} for request: {uniqueRequest}");

        var createdProyecto = await createResponse.Content.ReadFromJsonAsync<ProyectoResponse>();
        createdProyecto.Should().NotBeNull();

        // 4. GET the proyecto by empresaId and proyectoId
        var getResponse = await _client.GetAsync(
            $"/api/empresas/{empresa.Id}/proyectos/{createdProyecto!.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var detalle = await getResponse.Content.ReadFromJsonAsync<ProyectoDetalleResponse>();
        detalle.Should().NotBeNull();

        // 5. Verify all fields match the original request
        detalle!.Nombre.Should().Be(uniqueRequest.Nombre);
        detalle.FechaHabilitacion.Should().Be(uniqueRequest.FechaHabilitacion);

        // 6. Verify EmpresaId matches the empresa we created
        detalle.EmpresaId.Should().Be(empresa.Id);
        detalle.EmpresaNombre.Should().Be(empresaRequest.Nombre);

        // 7. Verify EstadoHabilitacion defaults to true when null was sent
        if (uniqueRequest.EstadoHabilitacion is null)
        {
            detalle.EstadoHabilitacion.Should().BeTrue(
                "EstadoHabilitacion should default to true when null is sent");
        }
        else
        {
            detalle.EstadoHabilitacion.Should().Be(uniqueRequest.EstadoHabilitacion.Value);
        }

        // Also verify the POST response had consistent data
        createdProyecto.Nombre.Should().Be(uniqueRequest.Nombre);
        createdProyecto.FechaHabilitacion.Should().Be(uniqueRequest.FechaHabilitacion);
        createdProyecto.EmpresaId.Should().Be(empresa.Id);

        if (uniqueRequest.EstadoHabilitacion is null)
        {
            createdProyecto.EstadoHabilitacion.Should().BeTrue();
        }
        else
        {
            createdProyecto.EstadoHabilitacion.Should().Be(uniqueRequest.EstadoHabilitacion.Value);
        }

        return true;
    }
}
