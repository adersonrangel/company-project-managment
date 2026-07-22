namespace CompanyProjectManagement.Api.Controllers;

using CompanyProjectManagement.Application.DTOs.Requests;
using CompanyProjectManagement.Application.Services;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/empresas")]
public class EmpresaController : ControllerBase
{
    private readonly IEmpresaService _empresaService;

    public EmpresaController(IEmpresaService empresaService)
    {
        _empresaService = empresaService;
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearEmpresaRequest request)
    {
        var resultado = await _empresaService.CrearAsync(request);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = resultado.Id }, resultado);
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var empresas = await _empresaService.ListarAsync();
        return Ok(empresas);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var empresa = await _empresaService.ObtenerPorIdAsync(id);
        return Ok(empresa);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarEmpresaRequest request)
    {
        var resultado = await _empresaService.ActualizarAsync(id, request);
        return Ok(resultado);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        await _empresaService.EliminarAsync(id);
        return NoContent();
    }
}
