namespace CompanyProjectManagement.Api.Controllers;

using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.Services;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/empresas/{empresaId:int}/proyectos")]
public class ProyectoController : ControllerBase
{
    private readonly IProyectoService _proyectoService;

    public ProyectoController(IProyectoService proyectoService)
    {
        _proyectoService = proyectoService;
    }

    [HttpPost]
    public async Task<IActionResult> Crear(int empresaId, [FromBody] CrearProyectoRequest request)
    {
        var resultado = await _proyectoService.CrearAsync(empresaId, request);
        return CreatedAtAction(nameof(ObtenerPorId), new { empresaId, proyectoId = resultado.Id }, resultado);
    }

    [HttpGet]
    public async Task<IActionResult> Listar(int empresaId)
    {
        var proyectos = await _proyectoService.ListarPorEmpresaAsync(empresaId);
        return Ok(proyectos);
    }

    [HttpGet("{proyectoId:int}")]
    public async Task<IActionResult> ObtenerPorId(int empresaId, int proyectoId)
    {
        var proyecto = await _proyectoService.ObtenerPorIdAsync(empresaId, proyectoId);
        return Ok(proyecto);
    }

    [HttpPut("{proyectoId:int}")]
    public async Task<IActionResult> Actualizar(int empresaId, int proyectoId, [FromBody] ActualizarProyectoRequest request)
    {
        var resultado = await _proyectoService.ActualizarAsync(empresaId, proyectoId, request);
        return Ok(resultado);
    }

    [HttpDelete("{proyectoId:int}")]
    public async Task<IActionResult> Eliminar(int empresaId, int proyectoId)
    {
        await _proyectoService.EliminarAsync(empresaId, proyectoId);
        return NoContent();
    }
}
