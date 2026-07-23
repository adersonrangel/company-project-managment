using System.Net;
using System.Net.Http.Json;
using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.DTOs.Responses;
using CompanyProjectManagement.Tests.Infrastructure;
using FluentAssertions;

namespace CompanyProjectManagement.Tests.IntegrationTests;

public class ProyectoEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ProyectoEndpointsTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<EmpresaResponse> CrearEmpresaAsync(string? identificacion = null)
    {
        var request = new CrearEmpresaRequest(
            Nombre: $"Empresa Test {Guid.NewGuid():N}",
            Identificacion: identificacion ?? Guid.NewGuid().ToString("N")[..20],
            Telefono: "+57 300 1234567",
            Direccion: "Calle 123 #45-67",
            EstadoHabilitacion: true
        );

        var response = await _client.PostAsJsonAsync("/api/empresas", request);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var empresa = await response.Content.ReadFromJsonAsync<EmpresaResponse>();
        return empresa!;
    }

    #region CRUD Exitoso

    [Fact]
    public async Task Crear_ConDatosValidos_Retorna201YProyectoCreado()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        var request = new CrearProyectoRequest(
            Nombre: "Proyecto Alpha",
            FechaHabilitacion: "2024-06-15",
            EstadoHabilitacion: true
        );

        // Act
        var response = await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var proyecto = await response.Content.ReadFromJsonAsync<ProyectoResponse>();
        proyecto.Should().NotBeNull();
        proyecto!.Id.Should().BeGreaterThan(0);
        proyecto.Nombre.Should().Be("Proyecto Alpha");
        proyecto.FechaHabilitacion.Should().Be("2024-06-15");
        proyecto.EstadoHabilitacion.Should().BeTrue();
        proyecto.EmpresaId.Should().Be(empresa.Id);
    }

    [Fact]
    public async Task Crear_SinEstadoHabilitacion_AsignaTrue()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        var request = new CrearProyectoRequest(
            Nombre: "Proyecto Sin Estado",
            FechaHabilitacion: "2024-01-01",
            EstadoHabilitacion: null
        );

        // Act
        var response = await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var proyecto = await response.Content.ReadFromJsonAsync<ProyectoResponse>();
        proyecto!.EstadoHabilitacion.Should().BeTrue();
    }

    [Fact]
    public async Task ListarPorEmpresa_ConProyectos_Retorna200YLista()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos",
            new CrearProyectoRequest("Proyecto Uno", "2024-01-01", true));
        await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos",
            new CrearProyectoRequest("Proyecto Dos", "2024-02-15", false));

        // Act
        var response = await _client.GetAsync($"/api/empresas/{empresa.Id}/proyectos");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var proyectos = await response.Content.ReadFromJsonAsync<List<ProyectoListResponse>>();
        proyectos.Should().NotBeNull();
        proyectos!.Count.Should().Be(2);
        proyectos.Should().Contain(p => p.Nombre == "Proyecto Uno");
        proyectos.Should().Contain(p => p.Nombre == "Proyecto Dos");
    }

    [Fact]
    public async Task ListarPorEmpresa_SinProyectos_Retorna200YListaVacia()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();

        // Act
        var response = await _client.GetAsync($"/api/empresas/{empresa.Id}/proyectos");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var proyectos = await response.Content.ReadFromJsonAsync<List<ProyectoListResponse>>();
        proyectos.Should().NotBeNull();
        proyectos!.Should().BeEmpty();
    }

    [Fact]
    public async Task ObtenerPorId_ProyectoExistente_Retorna200YDetalle()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        var crearResponse = await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos",
            new CrearProyectoRequest("Proyecto Detalle", "2024-03-20", true));
        var proyectoCreado = await crearResponse.Content.ReadFromJsonAsync<ProyectoResponse>();

        // Act
        var response = await _client.GetAsync($"/api/empresas/{empresa.Id}/proyectos/{proyectoCreado!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var detalle = await response.Content.ReadFromJsonAsync<ProyectoDetalleResponse>();
        detalle.Should().NotBeNull();
        detalle!.Id.Should().Be(proyectoCreado.Id);
        detalle.Nombre.Should().Be("Proyecto Detalle");
        detalle.FechaHabilitacion.Should().Be("2024-03-20");
        detalle.EstadoHabilitacion.Should().BeTrue();
        detalle.EmpresaId.Should().Be(empresa.Id);
        detalle.EmpresaNombre.Should().Be(empresa.Nombre);
    }

    [Fact]
    public async Task Actualizar_ConDatosValidos_Retorna200YProyectoActualizado()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        var crearResponse = await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos",
            new CrearProyectoRequest("Proyecto Original", "2024-01-01", true));
        var proyectoCreado = await crearResponse.Content.ReadFromJsonAsync<ProyectoResponse>();

        var actualizarRequest = new ActualizarProyectoRequest(
            Nombre: "Proyecto Actualizado",
            FechaHabilitacion: "2025-06-30",
            EstadoHabilitacion: false
        );

        // Act
        var response = await _client.PutAsJsonAsync(
            $"/api/empresas/{empresa.Id}/proyectos/{proyectoCreado!.Id}", actualizarRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var actualizado = await response.Content.ReadFromJsonAsync<ProyectoResponse>();
        actualizado.Should().NotBeNull();
        actualizado!.Nombre.Should().Be("Proyecto Actualizado");
        actualizado.FechaHabilitacion.Should().Be("2025-06-30");
        actualizado.EstadoHabilitacion.Should().BeFalse();
        actualizado.EmpresaId.Should().Be(empresa.Id);
    }

    [Fact]
    public async Task Actualizar_SoloNombre_Retorna200YSoloNombreCambia()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        var crearResponse = await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos",
            new CrearProyectoRequest("Proyecto Parcial", "2024-05-10", true));
        var proyectoCreado = await crearResponse.Content.ReadFromJsonAsync<ProyectoResponse>();

        var actualizarRequest = new ActualizarProyectoRequest(
            Nombre: "Nombre Nuevo",
            FechaHabilitacion: null,
            EstadoHabilitacion: null
        );

        // Act
        var response = await _client.PutAsJsonAsync(
            $"/api/empresas/{empresa.Id}/proyectos/{proyectoCreado!.Id}", actualizarRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var actualizado = await response.Content.ReadFromJsonAsync<ProyectoResponse>();
        actualizado!.Nombre.Should().Be("Nombre Nuevo");
        actualizado.FechaHabilitacion.Should().Be("2024-05-10");
        actualizado.EstadoHabilitacion.Should().BeTrue();
    }

    [Fact]
    public async Task Eliminar_ProyectoExistente_Retorna204()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        var crearResponse = await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos",
            new CrearProyectoRequest("Proyecto Eliminar", "2024-07-01", true));
        var proyectoCreado = await crearResponse.Content.ReadFromJsonAsync<ProyectoResponse>();

        // Act
        var response = await _client.DeleteAsync(
            $"/api/empresas/{empresa.Id}/proyectos/{proyectoCreado!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verificar que ya no existe
        var getResponse = await _client.GetAsync(
            $"/api/empresas/{empresa.Id}/proyectos/{proyectoCreado.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region Casos de Error

    [Fact]
    public async Task Crear_EmpresaInexistente_Retorna404()
    {
        // Arrange
        var request = new CrearProyectoRequest("Proyecto Huerfano", "2024-01-01", true);

        // Act
        var response = await _client.PostAsJsonAsync("/api/empresas/99999/proyectos", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task ListarPorEmpresa_EmpresaInexistente_Retorna404()
    {
        // Act
        var response = await _client.GetAsync("/api/empresas/99999/proyectos");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task ObtenerPorId_ProyectoInexistente_Retorna404()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();

        // Act
        var response = await _client.GetAsync($"/api/empresas/{empresa.Id}/proyectos/99999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task ObtenerPorId_EmpresaInexistente_Retorna404()
    {
        // Act
        var response = await _client.GetAsync("/api/empresas/99999/proyectos/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Crear_NombreDuplicadoEnMismaEmpresa_Retorna409()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        var request = new CrearProyectoRequest("Proyecto Duplicado", "2024-01-01", true);
        await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos", request);

        // Act - Intentar crear otro proyecto con el mismo nombre en la misma empresa
        var response = await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Crear_NombreDuplicadoEnDiferenteEmpresa_Retorna201()
    {
        // Arrange
        var empresa1 = await CrearEmpresaAsync();
        var empresa2 = await CrearEmpresaAsync();
        var request = new CrearProyectoRequest("Proyecto Compartido", "2024-01-01", true);
        await _client.PostAsJsonAsync($"/api/empresas/{empresa1.Id}/proyectos", request);

        // Act - Crear proyecto con mismo nombre pero en empresa diferente
        var response = await _client.PostAsJsonAsync($"/api/empresas/{empresa2.Id}/proyectos", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Crear_NombreVacio_Retorna400()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        var request = new CrearProyectoRequest("", "2024-01-01", true);

        // Act
        var response = await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Crear_FechaInvalida_Retorna400()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        var request = new CrearProyectoRequest("Proyecto Fecha Mala", "fecha-invalida", true);

        // Act
        var response = await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Crear_FechaFueraDeRango_Retorna400()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        var request = new CrearProyectoRequest("Proyecto Fecha Rango", "1999-12-31", true);

        // Act
        var response = await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Actualizar_ProyectoInexistente_Retorna404()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        var request = new ActualizarProyectoRequest("Nuevo Nombre", null, null);

        // Act
        var response = await _client.PutAsJsonAsync(
            $"/api/empresas/{empresa.Id}/proyectos/99999", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Actualizar_EmpresaInexistente_Retorna404()
    {
        // Arrange
        var request = new ActualizarProyectoRequest("Nuevo Nombre", null, null);

        // Act
        var response = await _client.PutAsJsonAsync("/api/empresas/99999/proyectos/1", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Actualizar_NombreDuplicado_Retorna409()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();
        await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos",
            new CrearProyectoRequest("Proyecto Existente", "2024-01-01", true));
        var crearResponse = await _client.PostAsJsonAsync($"/api/empresas/{empresa.Id}/proyectos",
            new CrearProyectoRequest("Proyecto A Renombrar", "2024-02-01", true));
        var proyectoCreado = await crearResponse.Content.ReadFromJsonAsync<ProyectoResponse>();

        var request = new ActualizarProyectoRequest("Proyecto Existente", null, null);

        // Act
        var response = await _client.PutAsJsonAsync(
            $"/api/empresas/{empresa.Id}/proyectos/{proyectoCreado!.Id}", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Eliminar_ProyectoInexistente_Retorna404()
    {
        // Arrange
        var empresa = await CrearEmpresaAsync();

        // Act
        var response = await _client.DeleteAsync($"/api/empresas/{empresa.Id}/proyectos/99999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Eliminar_EmpresaInexistente_Retorna404()
    {
        // Act
        var response = await _client.DeleteAsync("/api/empresas/99999/proyectos/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Mensaje.Should().NotBeNullOrWhiteSpace();
    }

    #endregion
}
