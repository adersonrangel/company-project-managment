using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.DTOs.Responses;
using CompanyProjectManagement.Tests.Infrastructure;

namespace CompanyProjectManagement.Tests.IntegrationTests;

/// <summary>
/// Pruebas de integración para los endpoints CRUD de Empresa.
/// Valida flujos completos y casos de error contra la API real con base de datos en memoria.
///
/// **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.3, 2.4, 3.1, 3.3, 3.4, 4.1, 4.3, 4.4**
/// </summary>
public class EmpresaEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public EmpresaEndpointsTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    #region Helpers

    private static CrearEmpresaRequest CrearEmpresaValida(string? identificacion = null) => new(
        Nombre: "Empresa Test",
        Identificacion: identificacion ?? $"EMP-{Guid.NewGuid():N}"[..20],
        Telefono: "+57 300-1234567",
        Direccion: "Calle 123 #45-67, Bogotá",
        EstadoHabilitacion: true
    );

    private async Task<EmpresaResponse> CrearEmpresaAsync(string? identificacion = null)
    {
        var request = CrearEmpresaValida(identificacion);
        var response = await _client.PostAsJsonAsync("/api/empresas", request);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var empresa = await response.Content.ReadFromJsonAsync<EmpresaResponse>();
        return empresa!;
    }

    #endregion

    #region CRUD - Flujo Exitoso

    [Fact]
    public async Task Crear_ConDatosValidos_Retorna201YEmpresaCreada()
    {
        // Arrange
        var request = CrearEmpresaValida();

        // Act
        var response = await _client.PostAsJsonAsync("/api/empresas", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var empresa = await response.Content.ReadFromJsonAsync<EmpresaResponse>();
        empresa.Should().NotBeNull();
        empresa!.Id.Should().BeGreaterThan(0);
        empresa.Nombre.Should().Be(request.Nombre);
        empresa.Identificacion.Should().Be(request.Identificacion);
        empresa.Telefono.Should().Be(request.Telefono);
        empresa.Direccion.Should().Be(request.Direccion);
        empresa.EstadoHabilitacion.Should().BeTrue();
    }

    [Fact]
    public async Task Listar_Retorna200ConListaDeEmpresas()
    {
        // Arrange
        var empresa1 = await CrearEmpresaAsync();
        var empresa2 = await CrearEmpresaAsync();

        // Act
        var response = await _client.GetAsync("/api/empresas");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var lista = await response.Content.ReadFromJsonAsync<List<EmpresaListResponse>>();
        lista.Should().NotBeNull();
        lista!.Should().Contain(e => e.Id == empresa1.Id);
        lista.Should().Contain(e => e.Id == empresa2.Id);
    }

    [Fact]
    public async Task ObtenerPorId_ConEmpresaExistente_Retorna200ConProyectos()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();

        // Act
        var response = await _client.GetAsync($"/api/empresas/{empresa.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var detalle = await response.Content.ReadFromJsonAsync<EmpresaDetalleResponse>();
        detalle.Should().NotBeNull();
        detalle!.Id.Should().Be(empresa.Id);
        detalle.Nombre.Should().Be(empresa.Nombre);
        detalle.Identificacion.Should().Be(empresa.Identificacion);
        detalle.Telefono.Should().Be(empresa.Telefono);
        detalle.Direccion.Should().Be(empresa.Direccion);
        detalle.EstadoHabilitacion.Should().Be(empresa.EstadoHabilitacion);
        detalle.Proyectos.Should().NotBeNull();
        detalle.Proyectos.Should().BeEmpty();
    }

    [Fact]
    public async Task Actualizar_ConDatosValidos_Retorna200ConDatosActualizados()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        var updateRequest = new ActualizarEmpresaRequest(
            Nombre: "Empresa Actualizada",
            Identificacion: empresa.Identificacion,
            Telefono: "+57 311-9876543",
            Direccion: "Carrera 90 #10-20, Medellín",
            EstadoHabilitacion: false
        );

        // Act
        var response = await _client.PutAsJsonAsync($"/api/empresas/{empresa.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var actualizada = await response.Content.ReadFromJsonAsync<EmpresaResponse>();
        actualizada.Should().NotBeNull();
        actualizada!.Id.Should().Be(empresa.Id);
        actualizada.Nombre.Should().Be("Empresa Actualizada");
        actualizada.Telefono.Should().Be("+57 311-9876543");
        actualizada.Direccion.Should().Be("Carrera 90 #10-20, Medellín");
        actualizada.EstadoHabilitacion.Should().BeFalse();
    }

    [Fact]
    public async Task Eliminar_SinProyectosAsociados_Retorna204()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();

        // Act
        var response = await _client.DeleteAsync($"/api/empresas/{empresa.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify empresa is no longer retrievable
        var getResponse = await _client.GetAsync($"/api/empresas/{empresa.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region Casos de Error

    [Fact]
    public async Task Crear_ConIdentificacionDuplicada_Retorna409()
    {
        // Arrange
        var identificacion = $"DUP-{Guid.NewGuid():N}"[..20];
        await CrearEmpresaAsync(identificacion);

        var request = CrearEmpresaValida(identificacion);

        // Act
        var response = await _client.PostAsJsonAsync("/api/empresas", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task ObtenerPorId_ConIdInexistente_Retorna404()
    {
        // Act
        var response = await _client.GetAsync("/api/empresas/99999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Crear_ConValidacionFallida_Retorna400()
    {
        // Arrange - nombre vacío, teléfono con caracteres inválidos
        var request = new CrearEmpresaRequest(
            Nombre: "",
            Identificacion: "ID-VALIDA",
            Telefono: "abc_invalid!",
            Direccion: "",
            EstadoHabilitacion: true
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/empresas", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrEmpty();
        error.Errores.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Actualizar_ConIdentificacionDuplicada_Retorna409()
    {
        // Arrange - crear dos empresas
        var empresa1 = await CrearEmpresaAsync();
        var empresa2 = await CrearEmpresaAsync();

        // Intentar actualizar empresa2 con la identificación de empresa1
        var updateRequest = new ActualizarEmpresaRequest(
            Nombre: "Empresa 2 Modificada",
            Identificacion: empresa1.Identificacion,
            Telefono: "+57 300-0000000",
            Direccion: "Dirección nueva",
            EstadoHabilitacion: true
        );

        // Act
        var response = await _client.PutAsJsonAsync($"/api/empresas/{empresa2.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Actualizar_EmpresaInexistente_Retorna404()
    {
        // Arrange
        var updateRequest = new ActualizarEmpresaRequest(
            Nombre: "Empresa Fantasma",
            Identificacion: "FANTASMA-001",
            Telefono: "+57 300-0000000",
            Direccion: "No existe",
            EstadoHabilitacion: true
        );

        // Act
        var response = await _client.PutAsJsonAsync("/api/empresas/99999", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Eliminar_EmpresaInexistente_Retorna404()
    {
        // Act
        var response = await _client.DeleteAsync("/api/empresas/99999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Eliminar_ConProyectosAsociados_Retorna409()
    {
        // Arrange - crear empresa y asociar un proyecto
        var empresa = await CrearEmpresaAsync();

        var proyectoRequest = new CrearProyectoRequest(
            Nombre: "Proyecto de Prueba",
            FechaHabilitacion: "2024-06-15",
            EstadoHabilitacion: true
        );
        var crearProyectoResponse = await _client.PostAsJsonAsync(
            $"/api/empresas/{empresa.Id}/proyectos", proyectoRequest);
        crearProyectoResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Act - intentar eliminar la empresa
        var response = await _client.DeleteAsync($"/api/empresas/{empresa.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrEmpty();

        // Verify empresa still exists
        var getResponse = await _client.GetAsync($"/api/empresas/{empresa.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Actualizar_ConValidacionFallida_Retorna400()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        var updateRequest = new ActualizarEmpresaRequest(
            Nombre: "",
            Identificacion: "",
            Telefono: "invalid!phone@#",
            Direccion: "",
            EstadoHabilitacion: true
        );

        // Act
        var response = await _client.PutAsJsonAsync($"/api/empresas/{empresa.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrEmpty();
        error.Errores.Should().NotBeNullOrEmpty();
    }

    #endregion
}
