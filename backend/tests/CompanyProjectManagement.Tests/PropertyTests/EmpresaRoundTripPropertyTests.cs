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
/// Feature: company-project-management, Property 1: Round-trip de creación de Empresa
/// Para cualquier combinación válida de datos de empresa, al crear la empresa y luego consultarla,
/// todos los campos retornados deben coincidir exactamente con los datos enviados.
/// 
/// **Validates: Requirements 1.1, 2.3, 3.1**
/// </summary>
public class EmpresaRoundTripPropertyTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public EmpresaRoundTripPropertyTests()
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
    public Property RoundTrip_CrearEmpresa_AllFieldsMatch()
    {
        return Prop.ForAll(Arbitraries.ValidCrearEmpresaRequest(), request =>
        {
            // Ensure Identificacion is unique AND within 50 chars.
            // The generator produces Identificacion of 1-50 chars. We replace the last 9 chars
            // with a short unique suffix to guarantee uniqueness without exceeding 50 chars.
            var shortId = Guid.NewGuid().ToString("N")[..8]; // 8 chars
            var baseId = request.Identificacion.Length > 41
                ? request.Identificacion[..41]
                : request.Identificacion;
            var uniqueId = $"{baseId}_{shortId}"; // At most 41 + 1 + 8 = 50 chars

            var uniqueRequest = request with { Identificacion = uniqueId };

            // POST - Create empresa
            var postResponse = _client.PostAsJsonAsync("/api/empresas", uniqueRequest).GetAwaiter().GetResult();

            postResponse.StatusCode.Should().Be(HttpStatusCode.Created,
                $"POST failed. Id.Length={uniqueRequest.Identificacion.Length}, " +
                $"Nombre.Length={uniqueRequest.Nombre.Length}, " +
                $"Tel.Length={uniqueRequest.Telefono.Length}, " +
                $"Dir.Length={uniqueRequest.Direccion.Length}");

            var created = postResponse.Content.ReadFromJsonAsync<EmpresaResponse>().GetAwaiter().GetResult();
            created.Should().NotBeNull();
            created!.Id.Should().BeGreaterThan(0);
            created.Nombre.Should().Be(uniqueRequest.Nombre);
            created.Identificacion.Should().Be(uniqueRequest.Identificacion);
            created.Telefono.Should().Be(uniqueRequest.Telefono);
            created.Direccion.Should().Be(uniqueRequest.Direccion);
            created.EstadoHabilitacion.Should().Be(uniqueRequest.EstadoHabilitacion ?? true);

            // GET by ID - Retrieve empresa
            var getResponse = _client.GetAsync($"/api/empresas/{created.Id}").GetAwaiter().GetResult();
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
